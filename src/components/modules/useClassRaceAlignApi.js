

const BASE_URL = 'https://www.dnd5eapi.co/api/2014'

async function fetchList(endpoint) {
  const response = await fetch(`${BASE_URL}/${endpoint}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch ${endpoint}: ${response.status}`)
  }
  const data = await response.json()
  // Each item looks like { index, name, url }
  return data.results
}

export const fetchClasses = () => fetchList('classes')
export const fetchRaces = () => fetchList('races')
export const fetchAlignments = () => fetchList('alignments')
export const fetchBackgrounds = () => fetchList('backgrounds')

// Fetches everything in parallel and returns four separate arrays
export async function fetchAllOptions() {
  const [classes, races, alignments, backgrounds] = await Promise.all([
    fetchClasses(),
    fetchRaces(),
    fetchAlignments(),
    fetchBackgrounds(),
  ])

  return { classes, races, alignments, backgrounds }
}











































// export  const classes = ref([])
// const API_BASE = 'https://www.dnd5eapi.co/api/2014'

// async function fetchClasses() {

//     try {
//       const response = await fetch(`${API_BASE}/classes`)
//       if (!response.ok)
//         throw new Error (`HTTP error! status: ${response.status}`)
//       const data = await response.json()
//       classes.value = data.results
//     }
//     catch (err) {
//       classError.value = 'Failed to load classes: ' + err.message
//     }
//     finally {
//       loading.value = false
//     }
// }





  // async function fetchRaces() {
  //   try {
  //     const response = await fetch(`${API_BASE}/races`)
  //     if (!response.ok)
  //       throw new Error (`HTTP error! status: ${response.status}`)
  //     const data = await response.json()
  //     races.value = data.results
  //   }
  //   catch (err) {
  //     raceError.value = 'Failed to load races: ' + err.message
  //   }
  //   finally {
  //     loading.value = false
  //   }
  // }

  // async function fetchAlignments() {
  //   try {
  //     const response = await fetch(`${API_BASE}/alignments`)
  //     if (!response.ok)
  //       throw new Error (`HTTP error! status: ${response.status}`)
  //     const data = await response.json()
  //     alignments.value = data.results
  //   }
  //   catch (err) {
  //     alignError.value = 'Failed to load alignments: ' + err.message
  //   }
  //   finally {
  //     loading.value = false
  //   }
  // }

  // async function fetchBackgrounds() {
  //   try {
  //     const response = await fetch(`${API_BASE}/backgrounds`)
  //     if (!response.ok)
  //       throw new Error (`HTTP error! status: ${response.status}`)
  //     const data = await response.json()
  //     backgrounds.value = data.results
  //   }
  //   catch (err) {
  //     backgroundError.value = 'Failed to load backgrounds: ' + err.message
  //   }
  //   finally {
  //     loading.value = false
  //   }
  // }



  // fetchRaces()
  // fetchAlignments()
  // fetchBackgrounds()

  // export const useClassRaceAlignApi = () => {
  //    {
  //     classes,
  //     races,
  //     alignments,
  //     backgrounds,
  //     loading,
  //     classError,
  //     raceError,
  //     alignError,
  //     backgroundError
  //   }

  // }

