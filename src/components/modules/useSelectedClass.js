import { ref, computed } from 'vue'
import { fetchClassDetails } from './useClassRaceAlignApi.js'
import { askChoices } from './useChoicePopup.js'
import { withItemDetails, fixedItems } from './useEquipment.js'

// This ref lives outside of any component, so every component that imports it
// shares the SAME box. When the top part fills it, the left and middle parts see it too.
export const selectedClass = ref(null)

// What the player picked in the popup (skills, tools, gear)
export const classChoices = ref([])

// All gear from the class (always-get + picked), with full API info attached
export const classItems = ref([])

// Called by the class <select> in the top part
export async function selectClass(index) {
  const chosenClass = await fetchClassDetails(index)
  selectedClass.value = chosenClass
  classChoices.value = []
  classItems.value = []

  // Open the popup and wait for the player to pick (a) or (b)
  classChoices.value = await askChoices(`${chosenClass.name}: pick your starting stuff`, [
    ...chosenClass.proficiency_choices,
    ...chosenClass.starting_equipment_options,
  ])

  const pickedItems = classChoices.value.filter((grant) => grant.type === 'equipment')
  classItems.value = await withItemDetails([...fixedItems(chosenClass.starting_equipment), ...pickedItems])
}

// Left part: is this ability (e.g. 'str') one of the class's saving throws?
export function isSavingThrow(abilityIndex) {
  if (!selectedClass.value) return false
  return selectedClass.value.saving_throws.some((save) => save.index === abilityIndex)
}

// Left part: did you pick this skill in the class popup? e.g. hasClassSkill('athletics')
export function hasClassSkill(skillIndex) {
  return classChoices.value.some(
    (grant) => grant.type === 'proficiencies' && grant.index === `skill-${skillIndex}`,
  )
}

// Left part: armor/weapon/tool proficiencies (saving throws and skills get checkboxes instead)
export const otherProficiencies = computed(() => {
  if (!selectedClass.value) return ''
  const always = selectedClass.value.proficiencies.filter(
    (prof) => !prof.index.startsWith('saving-throw'),
  )
  const picked = classChoices.value.filter(
    (grant) => grant.type === 'proficiencies' && !grant.index.startsWith('skill-'),
  )
  return [...always, ...picked].map((prof) => prof.name).join('\n')
})

// Middle part: e.g. '1d10' for a level 1 fighter
export const hitDice = computed(() => {
  if (!selectedClass.value) return ''
  return `1d${selectedClass.value.hit_die}`
})

// Middle part: at level 1 your max HP is the full hit die (plus CON modifier later)
export const maxHitPoints = computed(() => {
  if (!selectedClass.value) return ''
  return selectedClass.value.hit_die
})
