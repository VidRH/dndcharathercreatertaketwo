import { ref } from 'vue'
import { isSavingThrow, hasClassSkill } from './useSelectedClass.js'
import { selectedRace } from './useSelectedRace.js'
import { hasBackgroundSkill } from './useSelectedBackground.js'
import { abilityModifier } from './useAbilityScores.js'
import { proficiencyBonus, expertise } from './useLevelState.js'

// Which ability each skill uses (Player's Handbook). Sneaking is about being nimble -> DEX.
export const SKILL_ABILITY = {
  acrobatics: 'dex',
  'animal-handling': 'wis',
  arcana: 'int',
  athletics: 'str',
  deception: 'cha',
  history: 'int',
  insight: 'wis',
  intimidation: 'cha',
  investigation: 'int',
  medicine: 'wis',
  nature: 'int',
  perception: 'wis',
  performance: 'cha',
  persuasion: 'cha',
  religion: 'int',
  'sleight-of-hand': 'dex',
  stealth: 'dex',
  survival: 'wis',
}

// 'dex' -> 'Dex', for the little "(Dex)" note next to each skill
export function skillAbilityLabel(skillIndex) {
  const ability = SKILL_ABILITY[skillIndex]
  return ability.charAt(0).toUpperCase() + ability.slice(1)
}

// ---------------------------------------------------------------------------
// Checkboxes: ticked automatically by class/background/race, but YOU can change them
// ---------------------------------------------------------------------------

// What the player ticked/unticked by hand: { stealth: true, arcana: false }
// Missing = "do whatever the class/background/race says"
export const skillOverrides = ref({})
export const saveOverrides = ref({})

// Proficient because of your class, background or race (without your own clicks)
function autoSkill(skillIndex) {
  const elfKeenSenses =
    skillIndex === 'perception' &&
    selectedRace.value?.traits.some((trait) => trait.index === 'keen-senses')
  return hasBackgroundSkill(skillIndex) || hasClassSkill(skillIndex) || Boolean(elfKeenSenses)
}

export function isSkillProficient(skillIndex) {
  return skillOverrides.value[skillIndex] ?? autoSkill(skillIndex)
}

export function setSkillProficient(skillIndex, ticked) {
  skillOverrides.value[skillIndex] = ticked
}

export function isSaveProficient(abilityIndex) {
  return saveOverrides.value[abilityIndex] ?? isSavingThrow(abilityIndex)
}

export function setSaveProficient(abilityIndex, ticked) {
  saveOverrides.value[abilityIndex] = ticked
}

// Expertise (rogue/bard) = you're so good you add your proficiency bonus TWICE
export function hasExpertise(skillIndex) {
  return expertise.value.has(`skill-${skillIndex}`)
}

// ---------------------------------------------------------------------------
// The numbers
// ---------------------------------------------------------------------------

// Skill = ability modifier + proficiency bonus if ticked (x2 with expertise)
export function skillBonus(skillIndex) {
  const modifier = abilityModifier(SKILL_ABILITY[skillIndex])
  if (!isSkillProficient(skillIndex)) return modifier
  const timesProficient = hasExpertise(skillIndex) ? 2 : 1
  return modifier + proficiencyBonus.value * timesProficient
}

// Saving throw = ability modifier + proficiency bonus if ticked
export function saveBonus(abilityIndex) {
  const modifier = abilityModifier(abilityIndex)
  return isSaveProficient(abilityIndex) ? modifier + proficiencyBonus.value : modifier
}

// Noticing things without trying = 10 + your Perception skill
export function passivePerception() {
  return 10 + skillBonus('perception')
}
