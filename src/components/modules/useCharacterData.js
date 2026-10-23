import * as info from './useCharacterInfo.js'
import { selectedClass, classChoices, classItems } from './useSelectedClass.js'
import { selectedRace, raceChoices, raceTraits, chosenTraits } from './useSelectedRace.js'
import { selectedBackground, backgroundChoices, backgroundItems } from './useSelectedBackground.js'
import { level, experience, levelChoices } from './useLevelState.js'
import { classLevels, subclass, subclassLevels, levelPopup } from './useLevel.js'
import { abilityInputs, abilityMethod } from './useAbilityScores.js'
import { skillOverrides, saveOverrides } from './useSkills.js'
import { classSpells, chosenSpells } from './useSpells.js'
import { popup } from './useChoicePopup.js'

// Everything that makes up ONE character, in one list:
//   name in the saved data: [the shared box, what it holds on a blank sheet]
// Computed things (hit points, skill bonuses, spell save DC...) are NOT in here,
// they work themselves out again from these.
// Made a new shared ref for the character? Add it here, or it won't be saved!
const CHARACTER_BOXES = {
  // typed in by the player
  characterName: [info.characterName, ''],
  playerName: [info.playerName, ''],
  alignment: [info.alignment, ''],
  inspiration: [info.inspiration, false],
  personalityTraits: [info.personalityTraits, ''],
  ideals: [info.ideals, ''],
  bonds: [info.bonds, ''],
  flaws: [info.flaws, ''],
  age: [info.age, ''],
  height: [info.height, ''],
  weight: [info.weight, ''],
  eyes: [info.eyes, ''],
  hair: [info.hair, ''],
  skin: [info.skin, ''],
  appearance: [info.appearance, ''],
  backstory: [info.backstory, ''],
  allies: [info.allies, ''],
  symbols: [info.symbols, ''],
  additionalFeatures: [info.additionalFeatures, ''],
  treasure: [info.treasure, ''],

  // class, race and background: the full API info AND what was picked in the popups.
  // Saving the full info means loading never has to open the popups again.
  selectedClass: [selectedClass, null],
  classChoices: [classChoices, []],
  classItems: [classItems, []],
  selectedRace: [selectedRace, null],
  raceChoices: [raceChoices, []],
  raceTraits: [raceTraits, []],
  chosenTraits: [chosenTraits, []],
  selectedBackground: [selectedBackground, null],
  backgroundChoices: [backgroundChoices, []],
  backgroundItems: [backgroundItems, []],

  // level
  level: [level, 1],
  experience: [experience, 0],
  levelChoices: [levelChoices, {}],
  classLevels: [classLevels, []],
  subclass: [subclass, null],
  subclassLevels: [subclassLevels, []],

  // ability scores and the skill/saving throw ticks you changed by hand
  abilityInputs: [abilityInputs, {}],
  abilityMethod: [abilityMethod, null],
  skillOverrides: [skillOverrides, {}],
  saveOverrides: [saveOverrides, {}],

  // spells
  classSpells: [classSpells, []],
  chosenSpells: [chosenSpells, {}],
}

// A deep copy as plain data. It also:
// - unwraps Vue's reactive wrappers (Firestore can't save those)
// - drops `undefined` values (Firestore refuses those too)
// - makes sure a loaded/reset character never shares objects with another one
function copy(value) {
  return JSON.parse(JSON.stringify(value))
}

// Pack: every box -> one plain object, ready to save in Firestore
export function getCharacterData() {
  const data = {}
  for (const [name, [box]] of Object.entries(CHARACTER_BOXES)) {
    data[name] = copy(box.value)
  }
  return data
}

// Unpack: a saved object -> back into every box.
// Something missing (e.g. a character saved before a new field existed) gets the blank value.
export function loadCharacterData(data) {
  closePopups()
  for (const [name, [box, startValue]] of Object.entries(CHARACTER_BOXES)) {
    box.value = copy(name in data ? data[name] : startValue)
  }
}

// Wipe the table: every box back to a blank sheet (for "New Character")
export function resetCharacter() {
  closePopups()
  for (const [box, startValue] of Object.values(CHARACTER_BOXES)) {
    box.value = copy(startValue)
  }
}

// A half-finished popup belongs to the OLD character, so just close it
function closePopups() {
  popup.value = null
  levelPopup.value = null
}
