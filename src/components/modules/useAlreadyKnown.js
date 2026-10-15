import { computed } from 'vue'
import { selectedClass, classChoices } from './useSelectedClass.js'
import { selectedRace, raceChoices } from './useSelectedRace.js'
import { selectedBackground, backgroundChoices } from './useSelectedBackground.js'

// Gear and ability bonuses CAN double up (two handaxes is fine), so they never count as "known"
export const canDouble = (type) => type === 'equipment' || type === 'ability_bonuses'

// Every language, skill and tool the character already has, as a Set of indexes
// e.g. Set { 'common', 'elvish', 'skill-insight', 'light-armor', ... }
export const alreadyKnown = computed(() => {
  const known = new Set()

  // Things you always get
  selectedRace.value?.languages.forEach((lang) => known.add(lang.index))
  selectedClass.value?.proficiencies.forEach((prof) => known.add(prof.index))
  selectedBackground.value?.starting_proficiencies.forEach((prof) => known.add(prof.index))

  // Things you picked in earlier popups
  for (const grant of [...raceChoices.value, ...classChoices.value, ...backgroundChoices.value]) {
    if (!canDouble(grant.type)) known.add(grant.index)
  }
  return known
})
