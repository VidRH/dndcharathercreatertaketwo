import { ref, computed } from 'vue'
import { fetchBackgroundDetails } from './useClassRaceAlignApi.js'
import { askChoices } from './useChoicePopup.js'
import { withItemDetails, fixedItems } from './useEquipment.js'

// Shared box for the chosen background, same idea as selectedClass
export const selectedBackground = ref(null)

// What the player picked in the popup (languages, gear)
export const backgroundChoices = ref([])

// All gear from the background (always-get + picked), with full API info attached
export const backgroundItems = ref([])

// Called by the background <select> in the top part
export async function selectBackground(index) {
  const chosenBackground = await fetchBackgroundDetails(index)
  selectedBackground.value = chosenBackground
  backgroundChoices.value = []
  backgroundItems.value = []

  const choices = [
    chosenBackground.language_options,
    ...chosenBackground.starting_equipment_options,
  ].filter(Boolean)
  backgroundChoices.value = await askChoices(`${chosenBackground.name}: pick your extras`, choices)

  const pickedItems = backgroundChoices.value.filter((grant) => grant.type === 'equipment')
  backgroundItems.value = await withItemDetails([
    ...fixedItems(chosenBackground.starting_equipment),
    ...pickedItems,
  ])
}

// Left part: does the background give you this skill? e.g. hasBackgroundSkill('insight')
// The API calls the skill 'insight' in the skills list but 'skill-insight' in proficiencies
export function hasBackgroundSkill(skillIndex) {
  if (!selectedBackground.value) return false
  return selectedBackground.value.starting_proficiencies.some(
    (prof) => prof.index === `skill-${skillIndex}`,
  )
}

// Left part: everything that ISN'T a skill (tools, picked languages), since skills get a checkbox instead
export const backgroundProficiencies = computed(() => {
  if (!selectedBackground.value) return ''
  const tools = selectedBackground.value.starting_proficiencies
    .filter((prof) => !prof.index.startsWith('skill-'))
    .map((prof) => prof.name)
  const languages = backgroundChoices.value
    .filter((grant) => grant.type === 'languages')
    .map((lang) => `Language: ${lang.name}`)
  return [...tools, ...languages].join('\n')
})

// Middle part: starting money, e.g. { quantity: 15, unit: 'gp' }
export const backgroundMoney = computed(() => {
  if (!selectedBackground.value) return null
  return selectedBackground.value.starting_gold ?? null
})
