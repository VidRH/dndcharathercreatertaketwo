import { ref, computed } from 'vue'
import { level, experience, levelChoices, XP_THRESHOLDS } from './useLevelState.js'
import { selectedClass } from './useSelectedClass.js'
import { abilityModifier } from './useAbilityScores.js'
import { buildQuestion, collectGrants, isQuestionDone } from './useChoicePopup.js'
import {
  fetchClassLevels,
  fetchSubclasses,
  fetchSubclassLevels,
  fetchFeature,
} from './useClassRaceAlignApi.js'

// What the API says the class gets at each level (filled when you pick a class)
export const classLevels = ref([])
export const subclass = ref(null)
export const subclassLevels = ref([])

// What's shown in the level-up popup. null = closed.
// Looks like: { title, pages: [...one page per new level...], undoLevel, undoXp }
export const levelPopup = ref(null)

// ---------------------------------------------------------------------------
// XP and leveling
// ---------------------------------------------------------------------------

// XP you need for the next level (null at level 20, there is no next level)
export const nextLevelXp = computed(() => (level.value < 20 ? XP_THRESHOLDS[level.value] : null))

// The "Level up!" button only shows when you have enough XP
export const canLevelUp = computed(
  () => nextLevelXp.value !== null && experience.value >= nextLevelXp.value,
)

// XP is a running total (like in the book), so leveling up doesn't take it away
export async function levelUp() {
  if (canLevelUp.value) await setLevel(level.value + 1)
}

// Used by the level box AND the level up button
export async function setLevel(wantedLevel) {
  const newLevel = Math.min(20, Math.max(1, Math.floor(wantedLevel) || 1))
  const oldLevel = level.value
  const oldXp = experience.value
  if (newLevel === oldLevel) return

  level.value = newLevel

  // Keep XP matching the level: you need at least the minimum XP for your level,
  // and going DOWN puts XP at the start of the lower level
  const minXp = XP_THRESHOLDS[newLevel - 1]
  if (newLevel < oldLevel || experience.value < minXp) experience.value = minXp

  if (newLevel < oldLevel) {
    forgetLevelsAbove(newLevel)
  } else {
    await openLevelPopup(oldLevel + 1, newLevel, oldLevel, oldXp)
  }
}

// Going down a level throws away what you picked on the higher levels
function forgetLevelsAbove(maxLevel) {
  levelChoices.value = Object.fromEntries(
    Object.entries(levelChoices.value).filter(([lvl]) => Number(lvl) <= maxLevel),
  )
}

// Called right after the class popup. Loads the class's levels and asks for
// everything from level 1 up to your current level.
export async function onClassChosen() {
  const chosenClass = selectedClass.value
  levelChoices.value = {}
  classLevels.value = await fetchClassLevels(chosenClass.index)

  // The free API only has ONE subclass per class (e.g. Champion), so we just take it
  const subclasses = await fetchSubclasses(chosenClass.index)
  subclass.value = subclasses[0] ?? null
  subclassLevels.value = subclass.value ? await fetchSubclassLevels(subclass.value.index) : []

  await openLevelPopup(1, level.value, level.value, experience.value)
}

// ---------------------------------------------------------------------------
// Building the popup: one "page" per new level
// ---------------------------------------------------------------------------

// The kinds of "pick one" a feature can have (fighting style, expertise, favored enemy, terrain)
const FEATURE_CHOICE_KINDS = ['subfeature_options', 'expertise_options', 'enemy_type_options', 'terrain_type_options']

async function buildPage(lvl) {
  const classLevel = classLevels.value.find((entry) => entry.level === lvl)
  const previousLevel = classLevels.value.find((entry) => entry.level === lvl - 1)
  const subclassLevel = subclassLevels.value.find((entry) => entry.level === lvl)
  const features = [...(classLevel?.features ?? []), ...(subclassLevel?.features ?? [])]

  // Look up every new feature to see if it makes you choose something
  const details = await Promise.all(features.map((feature) => fetchFeature(feature.index)))
  const questions = []
  for (const feature of details) {
    for (const kind of FEATURE_CHOICE_KINDS) {
      const choice = feature.feature_specific?.[kind]
      if (!choice) continue
      const question = await buildQuestion(choice)
      question.title = feature.name
      question.mustKnow = kind === 'expertise_options' // expertise: only skills you already have
      questions.push(question)
    }
  }

  // The API counts ASIs: if the count went up since last level, you get one now
  const getsAsi = previousLevel && classLevel.ability_score_bonuses > previousLevel.ability_score_bonuses

  return {
    level: lvl,
    features: features.map((feature) => feature.name),
    profBonus: classLevel.prof_bonus,
    newProfBonus: previousLevel && classLevel.prof_bonus > previousLevel.prof_bonus,
    subclassName: subclassLevels.value[0]?.level === lvl ? subclass.value.name : null,
    hp: lvl > 1 ? { mode: '', roll: null } : null, // level 1 HP is always the full hit die
    asi: getsAsi ? ['', ''] : null, // two "+1 to ..." dropdowns
    questions,
  }
}

async function openLevelPopup(fromLevel, toLevel, undoLevel, undoXp) {
  if (classLevels.value.length === 0) return // no class picked yet, nothing to ask

  const pages = []
  for (let lvl = fromLevel; lvl <= toLevel; lvl++) pages.push(await buildPage(lvl))

  // Only open the popup if there's something to pick
  const needsInput = pages.some((page) => page.hp || page.asi || page.questions.length > 0)
  if (!needsInput) {
    pages.forEach(savePage)
    return
  }

  const title =
    fromLevel === toLevel ? `Level ${toLevel}!` : `Levels ${fromLevel} to ${toLevel}`
  levelPopup.value = { title, pages, undoLevel, undoXp }
}

// ---------------------------------------------------------------------------
// Hit points
// ---------------------------------------------------------------------------

export const hitDie = computed(() => selectedClass.value?.hit_die ?? 0)

// Taking the average instead of rolling: half the die + 1 (d10 -> 6)
export const averageHp = computed(() => hitDie.value / 2 + 1)

// You only get one roll per level, no re-rolling!
export function rollHitDie(page) {
  if (page.hp.roll === null) page.hp.roll = Math.floor(Math.random() * hitDie.value) + 1
}

// Level 1: full hit die + CON. Every level after: what you rolled (or the average) + CON.
// You always gain at least 1 HP per level, even with a bad CON.
export const maxHitPoints = computed(() => {
  if (!selectedClass.value) return ''
  const con = abilityModifier('con')
  let total = Math.max(1, hitDie.value + con)
  for (let lvl = 2; lvl <= level.value; lvl++) {
    const gain = levelChoices.value[lvl]?.hpGain ?? averageHp.value
    total += Math.max(1, gain + con)
  }
  return total
})

// e.g. '5d10' for a level 5 fighter
export const hitDice = computed(() =>
  selectedClass.value ? `${level.value}d${hitDie.value}` : '',
)

// ---------------------------------------------------------------------------
// Finishing the popup
// ---------------------------------------------------------------------------

export function isPageDone(page) {
  const hpDone = !page.hp || page.hp.mode === 'average' || page.hp.roll !== null
  const asiDone = !page.asi || page.asi.every((ability) => ability !== '')
  return hpDone && asiDone && page.questions.every(isQuestionDone)
}

function savePage(page) {
  levelChoices.value[page.level] = {
    hpGain: !page.hp ? 0 : page.hp.mode === 'average' ? averageHp.value : page.hp.roll,
    asi: page.asi ?? [],
    grants: collectGrants(page.questions),
    // remembered so the features box can show "Fighting Style -> Defense"
    picked: page.questions.map((question) => ({
      title: question.title,
      names: collectGrants([question]).map((grant) => grant.name),
    })),
  }
}

export function confirmLevelPopup() {
  levelPopup.value.pages.forEach(savePage)
  levelPopup.value = null
}

// Cancel = go back to the level and XP you had before
export function cancelLevelPopup() {
  const { undoLevel, undoXp } = levelPopup.value
  levelPopup.value = null
  forgetLevelsAbove(undoLevel)
  level.value = undoLevel
  experience.value = undoXp
}

// ---------------------------------------------------------------------------
// Attacks & Spellcasting box (middle part): combat stats like rage and ki
// ---------------------------------------------------------------------------

// Turns class_specific like { rage_count: 3, sneak_attack: { dice_count: 2, dice_value: 6 } }
// into ['Rage count: 3', 'Sneak attack: 2d6']
function describeClassStats(classLevel) {
  return Object.entries(classLevel?.class_specific ?? {})
    .map(([key, value]) => {
      const words = key.replaceAll('_', ' ')
      const name = words.charAt(0).toUpperCase() + words.slice(1)
      if (value?.dice_count) return `${name}: ${value.dice_count}d${value.dice_value}`
      if (typeof value === 'number' && value > 0) {
        // things like bardic_inspiration_die: 10 are a die size, so show 'd10'
        return key.endsWith('_die') ? `${name}: d${value}` : `${name}: ${value}`
      }
      return null // skip zeros, true/false and long lists
    })
    .filter(Boolean)
}

// The stats for the level you are now, e.g. a level 10 monk: 'Martial arts: 1d6', 'Ki points: 10'
export const combatStats = computed(() => {
  const currentLevel = classLevels.value.find((entry) => entry.level === level.value)
  return describeClassStats(currentLevel).join('\n')
})

// ---------------------------------------------------------------------------
// Features & Traits box (right part)
// ---------------------------------------------------------------------------

export const featuresText = computed(() => {
  if (!selectedClass.value || classLevels.value.length === 0) return ''

  const title = subclass.value
    ? `${selectedClass.value.name} ${level.value} (${subclass.value.name})`
    : `${selectedClass.value.name} ${level.value}`
  const lines = [title, '']

  // Every feature up to your level, with what you picked for it underneath
  for (let lvl = 1; lvl <= level.value; lvl++) {
    const classLevel = classLevels.value.find((entry) => entry.level === lvl)
    const subclassLevel = subclassLevels.value.find((entry) => entry.level === lvl)
    const features = [...(classLevel?.features ?? []), ...(subclassLevel?.features ?? [])]
    const picked = levelChoices.value[lvl]?.picked ?? []

    for (const feature of features) {
      lines.push(`Lvl ${lvl}: ${feature.name}`)
      for (const pick of picked.filter((p) => p.title === feature.name)) {
        pick.names.forEach((name) => lines.push(`   -> ${name}`))
      }
    }
  }
  return lines.join('\n')
})
