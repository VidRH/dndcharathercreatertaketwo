import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'

// Cloud Functions run on Google's servers, not in the browser. They use the Admin SDK,
// which ignores the security rules and can do two things the website can't:
//   - delete someone's login (so their email can sign up again)
//   - delete a document together with everything inside it (recursiveDelete)
// Because the rules don't protect us here, every function checks WHO is calling first.

initializeApp()
const db = getFirestore()
const bucket = () => getStorage().bucket()

// ---------- helpers ----------

// The uid of whoever called, or an error when they're not logged in
function callerOf(request) {
  if (!request.auth) throw new HttpsError('unauthenticated', 'You need to be logged in.')
  return request.auth.uid
}

async function isAdmin(uid) {
  const profile = await db.doc(`users/${uid}`).get()
  return profile.exists && profile.data().role === 'admin'
}

// A campaign and everything that belongs to it
async function deleteCampaignAndEverythingInIt(campaignId) {
  const campaignRef = db.doc(`campaigns/${campaignId}`)
  const campaign = await campaignRef.get()
  if (!campaign.exists) return

  // The players' own characters say which campaigns they play in: cross this one off.
  // (A character that was deleted meanwhile is fine, so errors are ignored.)
  const members = await campaignRef.collection('members').get()
  await Promise.all(
    members.docs.map((member) => {
      const { uid, characterId } = member.data()
      if (!uid || !characterId) return null
      return db
        .doc(`users/${uid}/characters/${characterId}`)
        .update({ campaignIds: FieldValue.arrayRemove(campaignId) })
        .catch(() => null)
    }),
  )

  const { inviteCode } = campaign.data()
  if (inviteCode) await db.doc(`inviteCodes/${inviteCode}`).delete()

  // Encounter maps
  await bucket().deleteFiles({ prefix: `campaigns/${campaignId}/` })

  // The campaign with its notes, characters, encounters, members... all in one go
  await db.recursiveDelete(campaignRef)
}

// ---------- callable functions ----------

// deleteCampaign({ campaignId }): the campaign's DM or an admin
export const deleteCampaign = onCall(async (request) => {
  const caller = callerOf(request)
  const campaignId = request.data?.campaignId
  if (typeof campaignId !== 'string' || !campaignId) {
    throw new HttpsError('invalid-argument', 'Which campaign?')
  }

  const campaign = await db.doc(`campaigns/${campaignId}`).get()
  if (!campaign.exists) throw new HttpsError('not-found', "This campaign doesn't exist (anymore).")
  if (campaign.data().dmId !== caller && !(await isAdmin(caller))) {
    throw new HttpsError('permission-denied', 'Only the DM of this campaign (or an admin) can delete it.')
  }

  await deleteCampaignAndEverythingInIt(campaignId)
  return { deleted: true }
})

// deleteAccount({ uid }): your own account, or anyone's if you're an admin.
// Removes the campaigns they run, their memberships, characters, profile, pictures and login.
export const deleteAccount = onCall(async (request) => {
  const caller = callerOf(request)
  const uid = request.data?.uid
  if (typeof uid !== 'string' || !uid) {
    throw new HttpsError('invalid-argument', 'Which account?')
  }
  if (uid !== caller && !(await isAdmin(caller))) {
    throw new HttpsError('permission-denied', 'Only admins can delete other accounts.')
  }

  // 1. The campaigns they're the DM of
  const ownCampaigns = await db.collection('campaigns').where('dmId', '==', uid).get()
  for (const campaign of ownCampaigns.docs) {
    await deleteCampaignAndEverythingInIt(campaign.id)
  }

  // 2. Their place in other people's campaigns (and the sheet copy the DM had)
  const memberships = await db.collectionGroup('members').where('uid', '==', uid).get()
  for (const membership of memberships.docs) {
    const campaignRef = membership.ref.parent.parent
    await campaignRef.collection('memberCharacters').doc(uid).delete()
    await membership.ref.delete()
  }

  // 3. Their profile and characters
  await db.recursiveDelete(db.doc(`users/${uid}`))

  // 4. Their profile pictures
  await bucket().deleteFiles({ prefix: `avatars/${uid}/` })

  // 5. The login itself, last: if anything above failed they can still log in and try again
  try {
    await getAuth().deleteUser(uid)
  } catch (e) {
    if (e.code !== 'auth/user-not-found') throw e
  }
  return { deleted: true }
})
