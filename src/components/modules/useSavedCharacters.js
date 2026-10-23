import { collection, doc, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db, auth } from '@/firebase'
import { getCharacterData } from './useCharacterData.js'

// Talking to Firestore: saving characters (and later: listing, loading, deleting them).

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
    return id
  }

  const newCharacter = await addDoc(charactersFolder(), { ...data, createdAt: serverTimestamp() })
  return newCharacter.id
}
