import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore'
import { db, auth } from '@/firebase'
import { getCharacterData, loadCharacterData } from './useCharacterData.js'
import { syncCharacterToCampaigns } from './useCampaignMembers.js'

// Talking to Firestore: saving, loading, listing and deleting characters.

// Every user has their own folder of characters: users/{their uid}/characters
function charactersFolder() {
  return collection(db, 'users', auth.currentUser.uid, 'characters')
}

// Saves what's on the sheet right now.
// No id = a new character: Firestore makes up an id and we give it back.
// An id = update that character instead of making a copy.
export async function saveCharacter(id) {
  // serverTimestamp() = "Firestore, fill in the time when you get this", used to sort the list
  const data = { ...getCharacterData(), updatedAt: serverTimestamp() }

  if (id) {
    await updateDoc(doc(charactersFolder(), id), data)
    // Campaigns this character plays in get the new version for their DM.
    // Not awaited: the save itself is done, this can finish in the background.
    syncCharacterToCampaigns(id).catch((err) => console.warn('Could not update the campaigns:', err))
    return id
  }

  const newCharacter = await addDoc(charactersFolder(), { ...data, createdAt: serverTimestamp() })
  return newCharacter.id
}

// Gets one saved character and puts it on the sheet
export async function loadCharacter(id) {
  const savedDoc = await getDoc(doc(charactersFolder(), id))
  if (!savedDoc.exists()) throw new Error("This character doesn't exist (maybe it was deleted).")
  loadCharacterData(savedDoc.data())
}

// All your characters, last edited first.
// The list page only needs a few things per character, so we just give back those.
export async function listCharacters() {
  const snapshot = await getDocs(query(charactersFolder(), orderBy('updatedAt', 'desc')))
  return snapshot.docs.map((savedDoc) => {
    const character = savedDoc.data()
    return {
      id: savedDoc.id,
      name: character.characterName,
      className: character.selectedClass?.name ?? '',
      raceName: character.selectedRace?.name ?? '',
      level: character.level,
      updatedAt: character.updatedAt?.toDate() ?? null, // Firestore time -> normal JS Date
    }
  })
}

export async function deleteCharacter(id) {
  await deleteDoc(doc(charactersFolder(), id))
}
