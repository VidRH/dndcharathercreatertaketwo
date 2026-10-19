const BASE_URL = 'https://www.dnd5eapi.co/api/2014'

async function fetchList(endpoint) {
  const response = await fetch(`${BASE_URL}/${endpoint}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch ${endpoint}: ${response.status}`)
  }
  const data = await response.json()
  return data.results
}

export const fetchClasses = () => fetchList('classes')
export const fetchRaces = () => fetchList('races')
export const fetchAlignments = () => fetchList('alignments')
export const fetchBackgrounds = () => fetchList('backgrounds')

// Fetches the full info for ONE thing, e.g. fetchDetails('classes', 'fighter')
async function fetchDetails(endpoint, index) {
  const response = await fetch(`${BASE_URL}/${endpoint}/${index}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch ${endpoint}/${index}: ${response.status}`)
  }
  return response.json()
}

export const fetchClassDetails = (index) => fetchDetails('classes', index)
export const fetchRaceDetails = (index) => fetchDetails('races', index)
export const fetchBackgroundDetails = (index) => fetchDetails('backgrounds', index)
export const fetchEquipmentCategory = (index) => fetchDetails('equipment-categories', index)
export const fetchFeature = (index) => fetchDetails('features', index)

// All 20 levels of a class, e.g. what a fighter gets at level 1, 2, 3...
// (The API doesn't always send them in order, so we sort them.)
export async function fetchClassLevels(classIndex) {
  const levels = await fetchDetails('classes', `${classIndex}/levels`)
  return levels.filter((entry) => !entry.subclass).sort((a, b) => a.level - b.level)
}

export async function fetchSubclasses(classIndex) {
  const data = await fetchDetails('classes', `${classIndex}/subclasses`)
  return data.results
}

// The extra features a subclass gives, e.g. Champion gets Improved Critical at level 3
export async function fetchSubclassLevels(subclassIndex) {
  const levels = await fetchDetails('subclasses', `${subclassIndex}/levels`)
  return levels.sort((a, b) => a.level - b.level)
}

// Remembers items we already looked up, so picking the same class twice doesn't refetch
const equipmentCache = new Map()
export function fetchEquipment(index) {
  if (!equipmentCache.has(index)) {
    equipmentCache.set(index, fetchDetails('equipment', index))
  }
  return equipmentCache.get(index)
}

// Some choices just say "pick from this url", e.g. '/api/2014/languages'
export async function fetchListByUrl(url) {
  const response = await fetch(`https://www.dnd5eapi.co${url}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`)
  }
  const data = await response.json()
  return data.results
}

// Fetches everything in parallel and returns four separate arrays
export async function fetchAllOptionsTopPart() {
  const [classes, races, alignments, backgrounds] = await Promise.all([
    fetchClasses(),
    fetchRaces(),
    fetchAlignments(),
    fetchBackgrounds(),
  ])

  return { classes, races, alignments, backgrounds }
}
