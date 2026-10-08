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
