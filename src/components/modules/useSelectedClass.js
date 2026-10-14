import { ref, computed } from 'vue'
import { fetchClassDetails } from './useClassRaceAlignApi.js'

// This ref lives outside of any component, so every component that imports it
// shares the SAME box. When the top part fills it, the left and middle parts see it too.
export const selectedClass = ref(null)

// Called by the class <select> in the top part
export async function selectClass(index) {
  selectedClass.value = await fetchClassDetails(index)
}

// Left part: is this ability (e.g. 'str') one of the class's saving throws?
export function isSavingThrow(abilityIndex) {
  if (!selectedClass.value) return false
  return selectedClass.value.saving_throws.some((save) => save.index === abilityIndex)
}

// Left part: armor/weapon proficiencies (saving throws are already shown as checkboxes)
export const otherProficiencies = computed(() => {
  if (!selectedClass.value) return ''
  return selectedClass.value.proficiencies
    .filter((prof) => !prof.index.startsWith('saving-throw'))
    .map((prof) => prof.name)
    .join('\n')
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

// Middle part: the gear you always get, plus the "pick one" choices
export const startingEquipment = computed(() => {
  if (!selectedClass.value) return ''
  const always = selectedClass.value.starting_equipment.map(
    (item) => `${item.quantity}x ${item.equipment.name}`,
  )
  const choices = selectedClass.value.starting_equipment_options.map(
    (option) => `Choose: ${option.desc}`,
  )
  return [...always, ...choices].join('\n')
})
