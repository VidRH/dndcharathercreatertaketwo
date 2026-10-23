import { ref, computed, watch } from 'vue'
import { selectedClass } from './useSelectedClass.js'
import { level, proficiencyBonus } from './useLevelState.js'
import { classLevels } from './useLevel.js'
import { abilityModifier } from './useAbilityScores.js'
import { fetchClassSpells } from './useClassRaceAlignApi.js'

// Every spell your class can learn (empty for fighters, rogues...)
export const classSpells = ref([])

// What's picked in each spell dropdown, keyed by "spellLevel-row":
// { '0-0': 'fire-bolt', '1-3': 'magic-missile' }
// Lives here (not in the page) so it survives switching pages.
export const chosenSpells = ref({})

// Called when you pick a class. A new class = a new spell list, so old picks are cleared.
export async function loadClassSpells() {
  chosenSpells.value = {}
  classSpells.value = selectedClass.value?.spellcasting
    ? await fetchClassSpells(selectedClass.value.index)
    : []
}

// ---------------------------------------------------------------------------
// The top of the spell page
// ---------------------------------------------------------------------------

// Which ability your magic comes from, e.g. 'int' for a wizard. null = can't cast spells.
export const spellcastingAbility = computed(
  () => selectedClass.value?.spellcasting?.spellcasting_ability.index ?? null,
)

export const isSpellcaster = computed(() => spellcastingAbility.value !== null)

// The level a class starts casting at (paladins and rangers: 2)
export const castingStartsAt = computed(() => selectedClass.value?.spellcasting?.level ?? null)

// How hard your spells are to dodge: 8 + proficiency bonus + spellcasting modifier
export const spellSaveDc = computed(() =>
  isSpellcaster.value ? 8 + proficiencyBonus.value + abilityModifier(spellcastingAbility.value) : null,
)

// What you add when you roll to hit with a spell: proficiency bonus + spellcasting modifier
export const spellAttackBonus = computed(() =>
  isSpellcaster.value ? proficiencyBonus.value + abilityModifier(spellcastingAbility.value) : null,
)

// ---------------------------------------------------------------------------
// Slots and how many spells you get (from the class's level table)
// ---------------------------------------------------------------------------

// e.g. { cantrips_known: 3, spell_slots_level_1: 2, ... } for a level 1 wizard
const currentSpellcasting = computed(
  () => classLevels.value.find((entry) => entry.level === level.value)?.spellcasting ?? null,
)

export function slotTotal(spellLevel) {
  return currentSpellcasting.value?.[`spell_slots_level_${spellLevel}`] ?? 0
}

// The highest spell level you have slots for. You can learn spells up to this level.
// (A level 5 warlock only has level 3 slots, but can still learn level 1 and 2 spells.)
export const highestSpellLevel = computed(() => {
  let highest = 0
  for (let spellLevel = 1; spellLevel <= 9; spellLevel++) {
    if (slotTotal(spellLevel) > 0) highest = spellLevel
  }
  return highest
})

export const cantripsKnown = computed(() => currentSpellcasting.value?.cantrips_known ?? 0)

// Bards, rangers, sorcerers and warlocks LEARN a fixed number of spells (the table says how many).
// Clerics, druids, wizards and paladins PREPARE spells: modifier + level (paladins: half level), at least 1.
export const learnsFixedSpells = computed(() => currentSpellcasting.value?.spells_known !== undefined)

export const spellLimit = computed(() => {
  if (highestSpellLevel.value === 0) return 0
  if (learnsFixedSpells.value) return currentSpellcasting.value.spells_known
  const levelPart = selectedClass.value.index === 'paladin' ? Math.floor(level.value / 2) : level.value
  return Math.max(1, abilityModifier(spellcastingAbility.value) + levelPart)
})

// ---------------------------------------------------------------------------
// The dropdowns
// ---------------------------------------------------------------------------

const spellLevelOf = (key) => Number(key.split('-')[0])

const picked = computed(() => Object.entries(chosenSpells.value).filter(([, spell]) => spell !== ''))
export const cantripsPicked = computed(() => picked.value.filter(([key]) => spellLevelOf(key) === 0).length)
export const spellsPicked = computed(() => picked.value.filter(([key]) => spellLevelOf(key) > 0).length)

// Can you use this spell level at all right now?
export function isSpellLevelAvailable(spellLevel) {
  return spellLevel === 0 ? cantripsKnown.value > 0 : spellLevel <= highestSpellLevel.value
}

// The spells that go in the dropdowns for one spell level
export function spellOptions(spellLevel) {
  if (!isSpellLevelAvailable(spellLevel)) return []
  return classSpells.value.filter((spell) => spell.level === spellLevel)
}

// A dropdown is usable if its level is available AND you haven't hit your limit.
// One that already has a spell stays usable, so you can swap it or clear it.
export function canUseRow(spellLevel, key) {
  if (!isSpellLevelAvailable(spellLevel)) return false
  if (chosenSpells.value[key]) return true
  return spellLevel === 0
    ? cantripsPicked.value < cantripsKnown.value
    : spellsPicked.value < spellLimit.value
}

// No doubles: a spell picked in one dropdown is greyed out in all the others
export function isSpellTaken(spellIndex, key) {
  return Object.entries(chosenSpells.value).some(
    ([otherKey, spell]) => otherKey !== key && spell === spellIndex,
  )
}

export function setSpell(key, spellIndex) {
  chosenSpells.value[key] = spellIndex
}

// Going down a level can take away high spell slots, so forget spells you can't cast any more
watch(highestSpellLevel, (highest) => {
  for (const key of Object.keys(chosenSpells.value)) {
    const spellLevel = spellLevelOf(key)
    if (spellLevel > 0 && spellLevel > highest) delete chosenSpells.value[key]
  }
})
