import { collection, doc, addDoc, getDoc, getDocs, writeBatch, serverTimestamp } from 'firebase/firestore'
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { db, storage } from '@/firebase'

// Talking to Firestore and Storage about a campaign's encounters.
//
// campaigns/{cid}/encounters/{id}        everything, only the DM reads this
// campaigns/{cid}/publicEncounters/{id}  ONLY the parts the DM unhid, what players will read
// campaigns/{cid}/encounters/{id}/...    the map image, in Storage
//
// Same idea as the characters: every save rebuilds the public copy from what's visible,
// and an encounter with nothing visible has no public copy at all.

const encountersFolder = (campaignId) => collection(db, 'campaigns', campaignId, 'encounters')
const publicFolder = (campaignId) => collection(db, 'campaigns', campaignId, 'publicEncounters')

// Everything starts hidden
export function emptyEncounter() {
  return {
    name: '',
    description: '',
    notes: '', // DM only, never shown
    mapUrl: '',
    mapPath: '', // where the map is in Storage, to delete it later
    partySize: 4, // for the calculations
    partyLevel: 1,
    monsters: [],
    visible: { name: false, description: false, map: false },
  }
}

// One monster in the encounter. key tells two goblin groups apart.
export function newMonsterEntry(statBlock) {
  return {
    key: crypto.randomUUID(),
    quantity: 1,
    notes: '', // DM only, never shown
    statBlock,
    visible: { name: false, statBlock: false },
  }
}

function monsterIsShown(monster) {
  return monster.visible.name || monster.visible.statBlock
}

// Only the visible parts, or null when nothing is visible
function publicVersion(encounter) {
  const shown = {}
  if (encounter.visible.name) shown.name = encounter.name
  if (encounter.visible.description) shown.description = encounter.description
  if (encounter.visible.map && encounter.mapUrl) shown.mapUrl = encounter.mapUrl

  const monsters = encounter.monsters
    .filter(monsterIsShown)
    .map((monster) => {
      const shownMonster = { key: monster.key }
      if (monster.visible.name) {
        shownMonster.name = monster.statBlock.name
        shownMonster.quantity = monster.quantity
      }
      if (monster.visible.statBlock) {
        const stats = { ...monster.statBlock }
        // the stat block's own name would give away a hidden name
        if (!monster.visible.name) delete stats.name
        // monsters added before pictures were dropped still have a link to one
        delete stats.imageUrl
        shownMonster.statBlock = stats
      }
      return shownMonster
    })
  if (monsters.length > 0) shown.monsters = monsters

  return Object.keys(shown).length > 0 ? shown : null
}

// The labels for "Players see: ..." on the encounter cards
export function shownToPlayers(encounter) {
  const shown = []
  if (encounter.visible?.name) shown.push('Name')
  if (encounter.visible?.description) shown.push('Description')
  if (encounter.visible?.map && encounter.mapUrl) shown.push('Map')
  const monsterCount = (encounter.monsters ?? []).filter(monsterIsShown).length
  if (monsterCount > 0) shown.push(`${monsterCount} monster${monsterCount === 1 ? '' : 's'}`)
  return shown
}

// All encounters of a campaign, last edited first
export async function listEncounters(campaignId) {
  const snapshot = await getDocs(encountersFolder(campaignId))
  return snapshot.docs
    .map((savedDoc) => {
      const encounter = savedDoc.data()
      return { id: savedDoc.id, ...encounter, updatedAt: encounter.updatedAt?.toDate() ?? null }
    })
    .sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0))
}

// A new, fully hidden encounter with just a name. Gives back its id.
export async function createEncounter(campaignId, name) {
  const newEncounter = await addDoc(encountersFolder(campaignId), {
    ...emptyEncounter(),
    name,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return newEncounter.id
}

export async function getEncounter(campaignId, encounterId) {
  let savedDoc
  try {
    savedDoc = await getDoc(doc(encountersFolder(campaignId), encounterId))
  } catch (e) {
    if (e.code === 'permission-denied') throw new Error("This encounter doesn't exist or isn't yours.", { cause: e })
    throw e
  }
  if (!savedDoc.exists()) throw new Error("This encounter doesn't exist (maybe it was deleted).")

  // Start from emptyEncounter() so every field is there, also on older saves
  const blank = emptyEncounter()
  const saved = savedDoc.data()
  return { ...blank, ...saved, visible: { ...blank.visible, ...saved.visible }, id: savedDoc.id }
}

// Saves the encounter and rebuilds its public copy, both at once
export async function saveEncounter(campaignId, encounterId, encounter) {
  const data = {}
  for (const key of Object.keys(emptyEncounter())) data[key] = encounter[key]

  const batch = writeBatch(db)
  batch.update(doc(encountersFolder(campaignId), encounterId), { ...data, updatedAt: serverTimestamp() })

  const shown = publicVersion(data)
  const publicDoc = doc(publicFolder(campaignId), encounterId)
  if (shown) batch.set(publicDoc, { ...shown, updatedAt: serverTimestamp() })
  else batch.delete(publicDoc) // deleting one that isn't there is fine
  await batch.commit()
}

// ---------- maps ----------

export const MAX_MAP_SIZE = 10 * 1024 * 1024 // 10 MB, storage.rules checks the same

// What's wrong with a map someone picked, or '' if it's fine
export function mapProblem(file) {
  if (!file.type.startsWith('image/')) return 'The map has to be an image.'
  if (file.size > MAX_MAP_SIZE) return 'The map must be smaller than 10 MB.'
  return ''
}

// Uploads a map and gives back { mapUrl, mapPath } to save in the encounter
export async function uploadEncounterMap(campaignId, encounterId, file) {
  const problem = mapProblem(file)
  if (problem) throw new Error(problem)

  // A new file name every time, otherwise browsers keep showing the old map they remember
  const mapPath = `campaigns/${campaignId}/encounters/${encounterId}/${Date.now()}`
  const fileRef = storageRef(storage, mapPath)
  await uploadBytes(fileRef, file, { contentType: file.type })
  return { mapUrl: await getDownloadURL(fileRef), mapPath }
}

// An old or removed map is just clutter, so a failed delete doesn't bother the user
export async function deleteMapFile(mapPath) {
  if (!mapPath) return
  try {
    await deleteObject(storageRef(storage, mapPath))
  } catch (e) {
    console.warn('Could not delete the old map:', e)
  }
}

// ---------- deleting ----------

export async function deleteEncounter(campaignId, encounterId, mapPath) {
  // The map first: Storage checks the campaign to know you're its DM
  await deleteMapFile(mapPath)
  const batch = writeBatch(db)
  batch.delete(doc(encountersFolder(campaignId), encounterId))
  batch.delete(doc(publicFolder(campaignId), encounterId))
  await batch.commit()
}

// For deleting a whole campaign: every encounter, public copy and map in it
export async function deleteAllEncounters(campaignId) {
  const [encounters, publicCopies] = await Promise.all([
    getDocs(encountersFolder(campaignId)),
    getDocs(publicFolder(campaignId)),
  ])
  await Promise.all(encounters.docs.map((savedDoc) => deleteMapFile(savedDoc.data().mapPath)))

  const batch = writeBatch(db)
  encounters.docs.forEach((savedDoc) => batch.delete(savedDoc.ref))
  publicCopies.docs.forEach((savedDoc) => batch.delete(savedDoc.ref))
  await batch.commit()
}
