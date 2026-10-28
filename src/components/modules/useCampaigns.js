import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore'
import { db, auth } from '@/firebase'
import { deleteAllCampaignCharacters } from './useCampaignCharacters.js'
import { deleteAllEncounters } from './useEncounters.js'
import { deleteAllMembers } from './useCampaignMembers.js'

// Talking to Firestore about campaigns: making, listing, loading, saving and deleting them.
//
// campaigns/{id}            name, shortDescription, longDescription, dmId, createdAt, updatedAt
// campaigns/{id}/private/dm notes
//
// The DM notes live in their own document because Firestore rules can only hide whole
// documents, not single fields. Players will be able to read the campaign later, never this one.

const campaignsFolder = () => collection(db, 'campaigns')
const notesDoc = (campaignId) => doc(db, 'campaigns', campaignId, 'private', 'dm')

export async function createCampaign({ name, shortDescription }) {
  const newCampaign = await addDoc(campaignsFolder(), {
    name,
    shortDescription,
    longDescription: '',
    dmId: auth.currentUser.uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return newCampaign.id
}

// The campaigns you are the DM of, last edited first.
// Sorted here instead of with orderBy: where + orderBy on different fields needs an extra Firestore index.
export async function listMyCampaigns() {
  const snapshot = await getDocs(query(campaignsFolder(), where('dmId', '==', auth.currentUser.uid)))
  return snapshot.docs
    .map((savedDoc) => {
      const campaign = savedDoc.data()
      return {
        id: savedDoc.id,
        name: campaign.name,
        shortDescription: campaign.shortDescription ?? '',
        updatedAt: campaign.updatedAt?.toDate() ?? null, // Firestore time -> normal JS Date
      }
    })
    .sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0))
}

// One campaign with its DM notes, for the campaign page
export async function getCampaign(campaignId) {
  let campaignDoc
  try {
    campaignDoc = await getDoc(doc(campaignsFolder(), campaignId))
  } catch (e) {
    // The rules say no when it isn't yours, and also when it doesn't exist
    // cause = keep Firebase's original error attached, handy when debugging
    if (e.code === 'permission-denied') throw new Error("This campaign doesn't exist or isn't yours.", { cause: e })
    throw e
  }
  if (!campaignDoc.exists()) throw new Error("This campaign doesn't exist (maybe it was deleted).")

  const notes = await getDoc(notesDoc(campaignId))
  return {
    id: campaignDoc.id,
    ...campaignDoc.data(),
    notes: notes.exists() ? notes.data().notes : '',
  }
}

// Saves the overview: the campaign fields and the DM notes together.
// A batch = both writes happen, or neither does.
export async function saveCampaign(campaignId, { name, shortDescription, longDescription, notes }) {
  const batch = writeBatch(db)
  batch.update(doc(campaignsFolder(), campaignId), {
    name,
    shortDescription,
    longDescription,
    updatedAt: serverTimestamp(),
  })
  // set + merge instead of update: older campaigns may not have a notes document yet
  batch.set(notesDoc(campaignId), { notes }, { merge: true })
  await batch.commit()
}

// Firestore doesn't delete what's inside a document along with it, so everything inside goes first.
// (The rules check the campaign itself to know you're its DM, so the campaign goes last.)
export async function deleteCampaign(campaignId) {
  const campaign = await getDoc(doc(campaignsFolder(), campaignId))
  const inviteCode = campaign.data()?.inviteCode

  await deleteAllCampaignCharacters(campaignId)
  await deleteAllEncounters(campaignId)
  await deleteAllMembers(campaignId)
  if (inviteCode) await deleteDoc(doc(db, 'inviteCodes', inviteCode))
  await deleteDoc(notesDoc(campaignId))
  await deleteDoc(doc(campaignsFolder(), campaignId))
}
