import { collection, doc, getDoc, getDocs } from 'firebase/firestore'
import { db } from '@/firebase'

// What a player reads of a campaign they joined. Only ever the public copies:
// the full characters, encounters and the DM notes are closed to players by the rules.

// The campaign itself, plus who the DM is
export async function getCampaignForPlayer(campaignId) {
  let saved
  try {
    saved = await getDoc(doc(db, 'campaigns', campaignId))
  } catch (e) {
    if (e.code === 'permission-denied') throw new Error("This campaign doesn't exist or you're not in it.", { cause: e })
    throw e
  }
  if (!saved.exists()) throw new Error("This campaign doesn't exist (maybe it was deleted).")

  const campaign = saved.data()
  const dm = await getDoc(doc(db, 'users', campaign.dmId))
  return {
    id: saved.id,
    name: campaign.name,
    shortDescription: campaign.shortDescription ?? '',
    longDescription: campaign.longDescription ?? '',
    dmId: campaign.dmId,
    dm: dm.exists() ? dm.data() : { displayName: 'Deleted account', photoURL: '' },
  }
}

// The characters the DM shared something of. Named ones A to Z, nameless ones last.
export async function listPublicCharacters(campaignId) {
  const snapshot = await getDocs(collection(db, 'campaigns', campaignId, 'publicCharacters'))
  return snapshot.docs
    .map((savedDoc) => ({ id: savedDoc.id, ...savedDoc.data() }))
    .sort((a, b) => {
      if (!a.name || !b.name) return a.name ? -1 : b.name ? 1 : 0
      return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
    })
}

// The encounters the DM shared something of, last changed first
export async function listPublicEncounters(campaignId) {
  const snapshot = await getDocs(collection(db, 'campaigns', campaignId, 'publicEncounters'))
  return snapshot.docs
    .map((savedDoc) => {
      const encounter = savedDoc.data()
      return { id: savedDoc.id, ...encounter, updatedAt: encounter.updatedAt?.toDate() ?? null }
    })
    .sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0))
}

export async function getPublicEncounter(campaignId, encounterId) {
  let saved
  try {
    saved = await getDoc(doc(db, 'campaigns', campaignId, 'publicEncounters', encounterId))
  } catch (e) {
    if (e.code === 'permission-denied') throw new Error("You're not in this campaign.", { cause: e })
    throw e
  }
  // No public copy = the DM hid everything again
  if (!saved.exists()) throw new Error("This encounter isn't shared with players (anymore).")
  return { id: saved.id, ...saved.data() }
}
