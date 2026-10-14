import { ref, computed } from 'vue'
import { fetchRaceDetails } from './useClassRaceAlignApi.js'

// Shared box for the chosen race, same idea as selectedClass
export const selectedRace = ref(null)

// Called by the race <select> in the top part
export async function selectRace(index) {
  selectedRace.value = await fetchRaceDetails(index)
}

// Left part: how much the race adds to an ability, e.g. raceBonus('con') -> 2 for a dwarf
export function raceBonus(abilityIndex) {
  if (!selectedRace.value) return 0
  const found = selectedRace.value.ability_bonuses.find(
    (bonus) => bonus.ability_score.index === abilityIndex,
  )
  return found ? found.bonus : 0
}

// Left part: languages the race can speak
export const raceLanguages = computed(() => {
  if (!selectedRace.value) return ''
  return selectedRace.value.languages.map((lang) => `Language: ${lang.name}`).join('\n')
})

// Middle part: walking speed in feet
export const raceSpeed = computed(() => {
  if (!selectedRace.value) return ''
  return selectedRace.value.speed
})
