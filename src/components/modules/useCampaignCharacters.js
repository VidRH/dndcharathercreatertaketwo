import { collection, doc, getDocs, writeBatch, serverTimestamp } from 'firebase/firestore'
import { db } from '@/firebase'
import { fetchAlignments } from './useClassRaceAlignApi.js'

// Talking to Firestore about the characters in a campaign (the DM's NPCs, not the players' sheets).
//
// campaigns/{cid}/characters/{id}        everything about the character, only the DM reads this
// campaigns/{cid}/publicCharacters/{id}  ONLY the parts the DM unhid, this is what players will read
//
// Firestore rules can only hide whole documents, not single fields. So every save rebuilds
// the public copy from what's visible, and a fully hidden character has no public copy at all.

const charactersFolder = (campaignId) => collection(db, 'campaigns', campaignId, 'characters')
const publicFolder = (campaignId) => collection(db, 'campaigns', campaignId, 'publicCharacters')

export const STATUS_OPTIONS = ['Alive', 'Dead', 'Missing', 'Thought to be dead', 'Captured', 'Unknown']

// The parts the DM can show or hide one by one. The true status and the notes are never shown.
export const SHOWABLE_FIELDS = [
  { key: 'name', label: 'Name' },
  { key: 'affiliation', label: 'Affiliation' },
  { key: 'alignment', label: 'Alignment' },
  { key: 'playerStatus', label: 'Status (what players think)' },
  { key: 'connections', label: 'Connections' },
]

// Everything starts hidden
export function emptyCharacter() {
  return {
    name: '',
    affiliation: '',
    alignment: '',
    dmStatus: 'Alive', // the truth
    playerStatus: 'Alive', // what the players believe
    connections: [], // [{ characterId, label, text }], characterId '' = free text only
    notes: '',
    visible: Object.fromEntries(SHOWABLE_FIELDS.map((field) => [field.key, false])),
  }
}

// Only the visible parts, or null when nothing is visible
function publicVersion(character) {
  const shown = {}
  for (const { key } of SHOWABLE_FIELDS) {
    if (character.visible?.[key]) shown[key] = character[key]
  }
  return Object.keys(shown).length > 0 ? shown : null
}

// Puts "save the character + rebuild its public copy" into a batch
function addSaveToBatch(batch, campaignId, id, character) {
  // merge so createdAt (only written the first time) stays
  batch.set(doc(charactersFolder(campaignId), id), { ...character, updatedAt: serverTimestamp() }, { merge: true })

  const shown = publicVersion(character)
  if (shown) batch.set(doc(publicFolder(campaignId), id), { ...shown, updatedAt: serverTimestamp() })
  else batch.delete(doc(publicFolder(campaignId), id)) // deleting one that isn't there is fine
}

// All characters of a campaign, A to Z
export async function listCampaignCharacters(campaignId) {
  const snapshot = await getDocs(charactersFolder(campaignId))
  return snapshot.docs
    .map((savedDoc) => ({ id: savedDoc.id, ...savedDoc.data() }))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))
}

// No id = a new character. Gives back the id either way.
export async function saveCampaignCharacter(campaignId, id, character) {
  const isNew = !id
  // doc() without an id makes up a new one, so we know it before saving
  const characterId = id ?? doc(charactersFolder(campaignId)).id

  const batch = writeBatch(db)
  addSaveToBatch(batch, campaignId, characterId, isNew ? { ...character, createdAt: serverTimestamp() } : character)
  await batch.commit()
  return characterId
}

// Deletes a character and takes it out of everyone else's connections.
// Gives back the new list, so the page doesn't have to fetch it all again.
export async function deleteCampaignCharacter(campaignId, id, allCharacters) {
  const batch = writeBatch(db)
  batch.delete(doc(charactersFolder(campaignId), id))
  batch.delete(doc(publicFolder(campaignId), id))

  const remaining = []
  for (const other of allCharacters) {
    if (other.id === id) continue
    const connections = other.connections ?? []
    if (connections.some((connection) => connection.characterId === id)) {
      const { id: otherId, ...data } = other
      const cleaned = { ...data, connections: connections.filter((connection) => connection.characterId !== id) }
      addSaveToBatch(batch, campaignId, otherId, cleaned)
      remaining.push({ id: otherId, ...cleaned })
    } else {
      remaining.push(other)
    }
  }

  await batch.commit()
  return remaining
}

// The alignment names from the API, fetched once and then remembered
let alignmentNames = null
export function getAlignmentNames() {
  if (!alignmentNames) {
    alignmentNames = fetchAlignments()
      .then((alignments) => alignments.map((alignment) => alignment.name))
      .catch((e) => {
        alignmentNames = null // so the next try asks the API again
        throw e
      })
  }
  return alignmentNames
}
