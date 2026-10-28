// The encounter maths from the 2014 Dungeon Master's Guide (chapter 3, "Creating a Combat Encounter").
// Only numbers to help plan: no initiative, hit point tracking or other combat.

// XP thresholds for ONE character of each level: [Easy, Medium, Hard, Deadly]
const XP_THRESHOLDS = {
  1: [25, 50, 75, 100],
  2: [50, 100, 150, 200],
  3: [75, 150, 225, 400],
  4: [125, 250, 375, 500],
  5: [250, 500, 750, 1100],
  6: [300, 600, 900, 1400],
  7: [350, 750, 1100, 1700],
  8: [450, 900, 1400, 2100],
  9: [550, 1100, 1600, 2400],
  10: [600, 1200, 1900, 2800],
  11: [800, 1600, 2400, 3600],
  12: [1000, 2000, 3000, 4500],
  13: [1100, 2200, 3400, 5100],
  14: [1250, 2500, 3800, 5700],
  15: [1400, 2800, 4300, 6400],
  16: [1600, 3200, 4800, 7200],
  17: [2000, 3900, 5900, 8800],
  18: [2100, 4200, 6300, 9500],
  19: [2400, 4900, 7300, 10900],
  20: [2800, 5700, 8500, 12700],
}

export const DIFFICULTIES = ['Easy', 'Medium', 'Hard', 'Deadly']

// More monsters are more dangerous than their XP alone says, so their XP gets multiplied.
// The middle six are the normal steps. The outer two are only reached through the party size rule.
const MULTIPLIERS = [0.5, 1, 1.5, 2, 2.5, 3, 4, 5]

// Score -> modifier, e.g. 14 -> 2, 8 -> -1
export function abilityModifier(score) {
  return Math.floor((score - 10) / 2)
}

// 2 -> '+2', -1 -> '-1', 0 -> '+0'
export function formatModifier(modifier) {
  return modifier >= 0 ? `+${modifier}` : `${modifier}`
}

// Which step of MULTIPLIERS a number of monsters normally gets
function multiplierStep(monsterCount) {
  if (monsterCount <= 1) return 1 // x1
  if (monsterCount === 2) return 2 // x1.5
  if (monsterCount <= 6) return 3 // x2
  if (monsterCount <= 10) return 4 // x2.5
  if (monsterCount <= 14) return 5 // x3
  return 6 // x4
}

// Fewer than 3 characters: one step up. 6 or more: one step down.
export function encounterMultiplier(monsterCount, partySize) {
  let step = multiplierStep(monsterCount)
  if (partySize < 3) step += 1
  else if (partySize >= 6) step -= 1
  return MULTIPLIERS[step]
}

// The whole party's thresholds, e.g. 4 level 1 characters -> { Easy: 100, Medium: 200, ... }
export function partyThresholds(partySize, partyLevel) {
  const perCharacter = XP_THRESHOLDS[partyLevel] ?? XP_THRESHOLDS[1]
  return Object.fromEntries(DIFFICULTIES.map((difficulty, i) => [difficulty, perCharacter[i] * partySize]))
}

// Everything the calculation panel shows.
// monsters = the encounter's monster list ({ quantity, statBlock: { xp } })
export function calculateEncounter(monsters, partySize, partyLevel) {
  // Keep odd input (empty box, 0, 25...) from breaking the maths
  const size = Math.min(Math.max(Math.round(partySize) || 1, 1), 10)
  const level = Math.min(Math.max(Math.round(partyLevel) || 1, 1), 20)

  const monsterCount = monsters.reduce((sum, monster) => sum + monster.quantity, 0)
  const totalXp = monsters.reduce((sum, monster) => sum + monster.quantity * (monster.statBlock.xp ?? 0), 0)
  const multiplier = encounterMultiplier(monsterCount, size)
  const adjustedXp = Math.round(totalXp * multiplier)
  const thresholds = partyThresholds(size, level)

  // The hardest difficulty the adjusted XP reaches. Below Easy = Trivial.
  let difficulty = monsterCount === 0 ? 'No monsters yet' : 'Trivial'
  if (monsterCount > 0) {
    for (const name of DIFFICULTIES) {
      if (adjustedXp >= thresholds[name]) difficulty = name
    }
  }

  return {
    monsterCount,
    totalXp,
    multiplier,
    adjustedXp,
    thresholds,
    difficulty,
    // Players share the real XP, not the adjusted one
    xpPerPlayer: Math.floor(totalXp / size),
  }
}
