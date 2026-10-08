const BASE_URL = 'https://www.dnd5eapi.co/api/2014'

async function fetchList(endpoint) {
  const response = await fetch(`${BASE_URL}/${endpoint}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch ${endpoint}: ${response.status}`)
  }
  const data = await response.json()
  return data.results
}

export const fetchAbilityScores = () => fetchList('ability-scores')
export const fetchSkills = () => fetchList('skills')
// export const fetchSavingThrows = () => fetchList('saving-throws')

export async function fetchAllOptionsLeftPart() {
  const [abilityScores, skills] = await Promise.all([
    fetchAbilityScores(),
    fetchSkills(),
    // fetchSavingThrows(),
  ])

  return { abilityScores, skills }
}
