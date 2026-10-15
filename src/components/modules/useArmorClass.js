import { computed } from 'vue'
import { selectedClass, classItems } from './useSelectedClass.js'
import { backgroundItems } from './useSelectedBackground.js'
import { abilityModifier } from './useAbilityScores.js'

const isArmor = (item) => item.details.equipment_category.index === 'armor'
const isShield = (item) => isArmor(item) && item.details.armor_category === 'Shield'

// How much ONE armor gives you. The API tells us: { base, dex_bonus, max_bonus }
function armorValue(armorClass, dex) {
  if (!armorClass.dex_bonus) return armorClass.base // heavy armor: DEX doesn't help
  if (armorClass.max_bonus) return armorClass.base + Math.min(dex, armorClass.max_bonus) // medium: DEX helps, max +2
  return armorClass.base + dex // light armor: all of your DEX helps
}

// Middle part: the armor class box
export const armorClass = computed(() => {
  const items = [...classItems.value, ...backgroundItems.value]
  const bodyArmor = items.filter((item) => isArmor(item) && !isShield(item))
  const shield = items.find(isShield)
  const dex = abilityModifier('dex')

  // No armor: 10 + DEX. Barbarians and monks have a special "Unarmored Defense" trick.
  let best = 10 + dex
  const classIndex = selectedClass.value?.index
  if (classIndex === 'barbarian') best = 10 + dex + abilityModifier('con')
  if (classIndex === 'monk' && !shield) best = 10 + dex + abilityModifier('wis')

  // With armor: try every armor you own and wear the best one
  for (const armor of bodyArmor) {
    best = Math.max(best, armorValue(armor.details.armor_class, dex))
  }

  // A shield goes on top of everything (+2)
  return shield ? best + shield.details.armor_class.base : best
})
