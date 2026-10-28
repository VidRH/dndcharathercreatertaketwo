import { collection, doc, getDoc, getDocs, updateDoc, getCountFromServer } from 'firebase/firestore'
import { ref as storageRef, deleteObject } from 'firebase/storage'
import { db, storage } from '@/firebase'

// What only admins do: look at every account and campaign, and edit them.
// (Deleting goes through the Cloud Functions in useCloudFunctions.js.)
// The rules let only admins list all users and all campaigns, so this fails for anyone else.

// Every account, A to Z
export async function listAllUsers() {
  const snapshot = await getDocs(collection(db, 'users'))
  return snapshot.docs
    .map((savedDoc) => {
      const user = savedDoc.data()
      return { uid: savedDoc.id, ...user, createdAt: user.createdAt?.toDate?.() ?? null }
    })
    .sort((a, b) => (a.displayName ?? '').localeCompare(b.displayName ?? '', undefined, { sensitivity: 'base' }))
}

// e.g. { displayName, description, role }
export async function updateUserAsAdmin(uid, changes) {
  await updateDoc(doc(db, 'users', uid), changes)
}

export async function removeUserPicture(uid, photoPath) {
  await updateDoc(doc(db, 'users', uid), { photoURL: '', photoPath: '' })
  if (!photoPath) return
  try {
    await deleteObject(storageRef(storage, photoPath))
  } catch (e) {
    console.warn('Could not delete the picture file:', e)
  }
}

// Every campaign, with its DM's name and how many players joined. Last edited first.
export async function listAllCampaigns() {
  const snapshot = await getDocs(collection(db, 'campaigns'))
  const campaigns = await Promise.all(
    snapshot.docs.map(async (savedDoc) => {
      const campaign = savedDoc.data()
      const [dm, members] = await Promise.all([
        getDoc(doc(db, 'users', campaign.dmId)),
        // only counts them, without downloading every member
        getCountFromServer(collection(db, 'campaigns', savedDoc.id, 'members')),
      ])
      return {
        id: savedDoc.id,
        name: campaign.name,
        shortDescription: campaign.shortDescription ?? '',
        dmName: dm.exists() ? dm.data().displayName : 'Deleted account',
        memberCount: members.data().count,
        updatedAt: campaign.updatedAt?.toDate() ?? null,
      }
    }),
  )
  return campaigns.sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0))
}
