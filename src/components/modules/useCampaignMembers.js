import {
  collection,
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  writeBatch,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
} from 'firebase/firestore'
import { db, auth } from '@/firebase'
import { cleanCode, findInviteCode } from './useInviteCodes.js'

// Talking to Firestore about who joined a campaign, and with which character.
//
// campaigns/{cid}/members/{uid}            uid, characterId, character (name, class, race, level), code, joinedAt
//    Who's in the campaign. Everyone in the campaign can read these.
// campaigns/{cid}/memberCharacters/{uid}   characterId, sheet (the whole character), updatedAt
//    A copy of the player's character sheet for the DM. Only the DM and that player can read it.
// users/{uid}/characters/{id}.campaignIds
//    The campaigns a character plays in, so saving the character can update its copies.

const membersFolder = (campaignId) => collection(db, 'campaigns', campaignId, 'members')
const memberDoc = (campaignId, uid) => doc(db, 'campaigns', campaignId, 'members', uid)
const sheetDoc = (campaignId, uid) => doc(db, 'campaigns', campaignId, 'memberCharacters', uid)
const myCharacterDoc = (characterId) => doc(db, 'users', auth.currentUser.uid, 'characters', characterId)

// The short version of a character, for lists
function summaryOf(sheet) {
  return {
    name: sheet.characterName || 'Unnamed character',
    className: sheet.selectedClass?.name ?? '',
    raceName: sheet.selectedRace?.name ?? '',
    level: sheet.level ?? 1,
  }
}

// A saved character without the bits that are about saving, not about the character
function sheetFrom(savedData) {
  const sheet = { ...savedData }
  delete sheet.createdAt
  delete sheet.updatedAt
  delete sheet.campaignIds
  return sheet
}

async function getMySheet(characterId) {
  const saved = await getDoc(myCharacterDoc(characterId))
  if (!saved.exists()) throw new Error("That character doesn't exist anymore.")
  return sheetFrom(saved.data())
}

// The character no longer plays in that campaign. If the character was deleted
// meanwhile there's nothing to update, which is fine.
async function forgetCampaign(characterId, campaignId) {
  try {
    await updateDoc(myCharacterDoc(characterId), { campaignIds: arrayRemove(campaignId) })
  } catch (e) {
    console.warn('Could not update the character:', e)
  }
}

// ---------- the player's side ----------

// Joins the campaign of an invite code with one of your characters. Gives back the campaign id.
export async function joinCampaign(codeText, characterId) {
  const uid = auth.currentUser.uid
  const code = cleanCode(codeText)
  if (!code) throw new Error('Type the invite code your DM gave you.')

  const invite = await findInviteCode(code)
  if (!invite) throw new Error('No campaign has that invite code. Check it with your DM.')
  const { campaignId } = invite
  if (invite.dmId === uid) throw new Error("That's the code of your own campaign.")
  if ((await getDoc(memberDoc(campaignId, uid))).exists()) throw new Error("You're already in this campaign.")

  const sheet = await getMySheet(characterId)

  // All at once: the membership, the sheet copy for the DM, and the note on your character
  const batch = writeBatch(db)
  batch.set(memberDoc(campaignId, uid), {
    uid,
    characterId,
    character: summaryOf(sheet),
    code, // the rules check this code really belongs to the campaign
    joinedAt: serverTimestamp(),
  })
  batch.set(sheetDoc(campaignId, uid), { characterId, sheet, updatedAt: serverTimestamp() })
  batch.update(myCharacterDoc(characterId), { campaignIds: arrayUnion(campaignId) })
  await batch.commit()
  return campaignId
}

// Every campaign you joined, newest first
export async function listJoinedCampaigns() {
  const uid = auth.currentUser.uid
  // collectionGroup = look in EVERY "members" folder of every campaign at once
  const snapshot = await getDocs(query(collectionGroup(db, 'members'), where('uid', '==', uid)))

  const joined = await Promise.all(
    snapshot.docs.map(async (memberSnapshot) => {
      // members/{uid} sits inside campaigns/{campaignId}, so its parent's parent is the campaign
      const campaignId = memberSnapshot.ref.parent.parent.id
      const campaign = await getDoc(doc(db, 'campaigns', campaignId))
      if (!campaign.exists()) return null

      const member = memberSnapshot.data()
      return {
        id: campaignId,
        name: campaign.data().name,
        shortDescription: campaign.data().shortDescription ?? '',
        characterId: member.characterId,
        character: member.character,
        joinedAt: member.joinedAt?.toDate() ?? null,
      }
    }),
  )
  return joined.filter(Boolean).sort((a, b) => (b.joinedAt ?? 0) - (a.joinedAt ?? 0))
}

// Play a campaign with another of your characters
export async function switchCharacter(campaignId, oldCharacterId, newCharacterId) {
  const uid = auth.currentUser.uid
  const sheet = await getMySheet(newCharacterId)

  const batch = writeBatch(db)
  batch.update(memberDoc(campaignId, uid), { characterId: newCharacterId, character: summaryOf(sheet) })
  batch.set(sheetDoc(campaignId, uid), { characterId: newCharacterId, sheet, updatedAt: serverTimestamp() })
  batch.update(myCharacterDoc(newCharacterId), { campaignIds: arrayUnion(campaignId) })
  await batch.commit()

  await forgetCampaign(oldCharacterId, campaignId)
}

export async function leaveCampaign(campaignId, characterId) {
  const uid = auth.currentUser.uid
  const batch = writeBatch(db)
  batch.delete(memberDoc(campaignId, uid))
  batch.delete(sheetDoc(campaignId, uid))
  await batch.commit()

  await forgetCampaign(characterId, campaignId)
}

// Called after saving a character: every campaign it plays in gets the new version.
// A campaign you left or were removed from is crossed off the character instead.
export async function syncCharacterToCampaigns(characterId) {
  const uid = auth.currentUser.uid
  const saved = await getDoc(myCharacterDoc(characterId))
  if (!saved.exists()) return
  const campaignIds = saved.data().campaignIds ?? []
  if (campaignIds.length === 0) return

  const sheet = sheetFrom(saved.data())
  for (const campaignId of campaignIds) {
    try {
      const member = await getDoc(memberDoc(campaignId, uid))
      if (!member.exists() || member.data().characterId !== characterId) {
        await forgetCampaign(characterId, campaignId)
        continue
      }
      const batch = writeBatch(db)
      batch.update(memberDoc(campaignId, uid), { character: summaryOf(sheet) })
      batch.set(sheetDoc(campaignId, uid), { characterId, sheet, updatedAt: serverTimestamp() })
      await batch.commit()
    } catch (e) {
      console.warn(`Could not update the character in campaign ${campaignId}:`, e)
    }
  }
}

// ---------- the DM's side ----------

// The profile of a user, or a stand-in when the account is gone
async function getProfile(uid) {
  const profile = await getDoc(doc(db, 'users', uid))
  return profile.exists()
    ? profile.data()
    : { displayName: 'Deleted account', description: '', photoURL: '', role: '' }
}

// Everyone who joined, with their profile (fetched fresh, so new names and pictures show)
export async function listMembers(campaignId) {
  const snapshot = await getDocs(membersFolder(campaignId))
  const members = await Promise.all(
    snapshot.docs.map(async (memberSnapshot) => {
      const member = memberSnapshot.data()
      return {
        ...member,
        joinedAt: member.joinedAt?.toDate() ?? null,
        profile: await getProfile(member.uid),
      }
    }),
  )
  return members.sort((a, b) => (a.joinedAt ?? 0) - (b.joinedAt ?? 0))
}

// One player for the DM: their profile, membership and the copy of their character sheet
export async function getMemberWithSheet(campaignId, uid) {
  const [member, sheet, profile] = await Promise.all([
    getDoc(memberDoc(campaignId, uid)),
    getDoc(sheetDoc(campaignId, uid)),
    getProfile(uid),
  ])
  if (!member.exists()) throw new Error("This player isn't in the campaign (anymore).")
  return {
    ...member.data(),
    joinedAt: member.data().joinedAt?.toDate() ?? null,
    profile,
    sheet: sheet.exists() ? sheet.data().sheet : null,
  }
}

export async function removeMember(campaignId, uid) {
  const batch = writeBatch(db)
  batch.delete(memberDoc(campaignId, uid))
  batch.delete(sheetDoc(campaignId, uid))
  await batch.commit()
}
