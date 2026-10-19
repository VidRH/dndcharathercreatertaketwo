import { ref, computed } from 'vue'

// This file only HOLDS the level data. The actions (level up, popup) live in useLevel.js.
// It's split so useAbilityScores.js can read level-up bonuses without the files importing each other in a circle.

// How much total XP you need to BE each level (Player's Handbook table)
// XP_THRESHOLDS[0] = level 1, XP_THRESHOLDS[1] = level 2, ...
export const XP_THRESHOLDS = [
  0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000,
  85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000,
]

export const level = ref(1)
export const experience = ref(0)

// What the player picked on each level-up page, saved per level, e.g.
// { 4: { hpGain: 6, asi: ['str', 'str'], grants: [...], picked: [{ title, names }] } }
export const levelChoices = ref({})

// +2 at levels 1-4, +3 at 5-8, +4 at 9-12, +5 at 13-16, +6 at 17-20
export const proficiencyBonus = computed(() => Math.floor((level.value - 1) / 4) + 2)

// How many +1s this ability got from Ability Score Improvements
export function asiBonus(abilityIndex) {
  return Object.values(levelChoices.value)
    .flatMap((choice) => choice.asi)
    .filter((ability) => ability === abilityIndex).length
}

// Skills you picked for Expertise (rogue/bard), so you can't pick the same one twice
export const expertise = computed(
  () =>
    new Set(
      Object.values(levelChoices.value)
        .flatMap((choice) => choice.grants)
        .filter((grant) => grant.type === 'proficiency')
        .map((grant) => grant.index),
    ),
)
