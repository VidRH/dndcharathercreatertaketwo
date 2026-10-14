import { ref, computed } from 'vue'
import { fetchBackgroundDetails } from './useClassRaceAlignApi.js'

// Shared box for the chosen background, same idea as selectedClass
export const selectedBackground = ref(null)

// Called by the background <select> in the top part
export async function selectBackground(index) {
  selectedBackground.value = await fetchBackgroundDetails(index)
}

// Left part: skills/tools the background makes you good at
export const backgroundProficiencies = computed(() => {
  if (!selectedBackground.value) return ''
  return selectedBackground.value.starting_proficiencies.map((prof) => prof.name).join('\n')
})

// Middle part: the gear the background gives you, plus the "pick one" choices
export const backgroundEquipment = computed(() => {
  if (!selectedBackground.value) return ''
  const always = selectedBackground.value.starting_equipment.map(
    (item) => `${item.quantity}x ${item.equipment.name}`,
  )
  const choices = selectedBackground.value.starting_equipment_options.map((option) => {
    // Some options have a text description, others just point at a category (e.g. "Holy Symbols")
    const what = option.desc ?? option.from.equipment_category?.name ?? 'an item'
    return `Choose ${option.choose}: ${what}`
  })
  return [...always, ...choices].join('\n')
})
