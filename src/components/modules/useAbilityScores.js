import { ref, computed } from 'vue'
import { raceBonus } from './useSelectedRace.js'

const ABILITIES = ['str', 'dex', 'con', 'int', 'wis', 'cha']

// What the player rolled/bought in each ability box, e.g. { str: 15, dex: 14 }
// This is the score BEFORE bonuses. Shared box, so the middle part can read DEX for armor class.
export const abilityInputs = ref({})

// How the player makes their scores: null (not picked yet), 'roll' or 'pointbuy'
export const abilityMethod = ref(null)

// ---------------------------------------------------------------------------
// Picking a method
// ---------------------------------------------------------------------------

export function chooseMethod(method) {
  abilityMethod.value = method
  // Fresh start: point buy starts every score at 8, rolling starts empty
  const startValue = method === 'pointbuy' ? 8 : ''
  abilityInputs.value = Object.fromEntries(ABILITIES.map((ability) => [ability, startValue]))
}

// Brings the cover back so the player can switch method
export function resetMethod() {
  abilityMethod.value = null
}

// ---------------------------------------------------------------------------
// Rolling
// ---------------------------------------------------------------------------

// A 20-sided die: a random whole number from 1 to 20
export function rollD20(abilityIndex) {
  abilityInputs.value[abilityIndex] = Math.floor(Math.random() * 20) + 1
}

// ---------------------------------------------------------------------------
// 27 point buy (from the Player's Handbook table)
// ---------------------------------------------------------------------------

export const POINT_BUDGET = 27
export const POINT_COST = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 }

export const pointsSpent = computed(() =>
  ABILITIES.reduce((total, ability) => total + (POINT_COST[abilityInputs.value[ability]] ?? 0), 0),
)

export const pointsLeft = computed(() => POINT_BUDGET - pointsSpent.value)

// How many points going up by 1 would cost, e.g. 13 -> 14 costs 2. null = already at 15.
export function costOfNextPoint(abilityIndex) {
  const score = abilityInputs.value[abilityIndex]
  if (score >= 15) return null
  return POINT_COST[score + 1] - POINT_COST[score]
}

export function canIncrease(abilityIndex) {
  const cost = costOfNextPoint(abilityIndex)
  return cost !== null && cost <= pointsLeft.value
}

export function canDecrease(abilityIndex) {
  return abilityInputs.value[abilityIndex] > 8
}

export function increase(abilityIndex) {
  if (canIncrease(abilityIndex)) abilityInputs.value[abilityIndex]++
}

export function decrease(abilityIndex) {
  if (canDecrease(abilityIndex)) abilityInputs.value[abilityIndex]--
}

// ---------------------------------------------------------------------------
// Bonuses and the final score
// ---------------------------------------------------------------------------

// All bonuses added ON TOP of the rolled/bought score, so they never cost points.
// In the 2014 rules only your race gives ability bonuses (classes and backgrounds don't).
export function abilityBonus(abilityIndex) {
  return raceBonus(abilityIndex)
}

// Rolled/bought score + bonuses. An empty box counts as 10 (a totally average person).
export function abilityTotal(abilityIndex) {
  const typed = abilityInputs.value[abilityIndex]
  const base = typed === undefined || typed === '' ? 10 : Number(typed)
  return base + abilityBonus(abilityIndex)
}

// The D&D rule: (score - 10) / 2, rounded down. 14 -> +2, 10 -> +0, 8 -> -1
export function abilityModifier(abilityIndex) {
  return Math.floor((abilityTotal(abilityIndex) - 10) / 2)
}

// Shows a modifier with its sign: 2 -> '+2', -1 -> '-1'
export function formatModifier(modifier) {
  return modifier >= 0 ? `+${modifier}` : `${modifier}`
}
