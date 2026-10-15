import { ref, computed } from 'vue'
import { fetchRaceDetails } from './useClassRaceAlignApi.js'
import { askChoices } from './useChoicePopup.js'

// Shared box for the chosen race, same idea as selectedClass
export const selectedRace = ref(null)

// What the player picked in the popup (extra languages, half-elf ability bonuses)
export const raceChoices = ref([])

// Called by the race <select> in the top part
export async function selectRace(index) {
  const chosenRace = await fetchRaceDetails(index)
  selectedRace.value = chosenRace
  raceChoices.value = []

  // Only some races have choices (human, half-elf). The rest skip the popup.
  const choices = [chosenRace.ability_bonus_options, chosenRace.language_options].filter(Boolean)
  raceChoices.value = await askChoices(`${chosenRace.name}: pick your extras`, choices)
}

// Left part: how much the race adds to an ability, e.g. raceBonus('con') -> 2 for a dwarf
export function raceBonus(abilityIndex) {
  if (!selectedRace.value) return 0
  const always = selectedRace.value.ability_bonuses
    .filter((bonus) => bonus.ability_score.index === abilityIndex)
    .reduce((total, bonus) => total + bonus.bonus, 0)
  const picked = raceChoices.value
    .filter((grant) => grant.type === 'ability_bonuses' && grant.index === abilityIndex)
    .reduce((total, grant) => total + grant.bonus, 0)
  return always + picked
}

// Left part: languages the race can speak (always-get + picked)
export const raceLanguages = computed(() => {
  if (!selectedRace.value) return ''
  const picked = raceChoices.value.filter((grant) => grant.type === 'languages')
  return [...selectedRace.value.languages, ...picked].map((lang) => `Language: ${lang.name}`).join('\n')
})

// Middle part: walking speed in feet
export const Speed = computed(() => {
  if (!selectedRace.value) return ''
  return selectedRace.value.speed
})
