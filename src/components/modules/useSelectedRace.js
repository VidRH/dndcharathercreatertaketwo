import { ref, computed } from 'vue'
import { fetchRaceDetails, fetchTrait } from './useClassRaceAlignApi.js'
import { askChoices } from './useChoicePopup.js'

// Shared box for the chosen race, same idea as selectedClass
export const selectedRace = ref(null)

// What the player picked in the popup (extra languages, half-elf ability bonuses  dragon colour, tools)
export const raceChoices = ref([])


// Full info for every race trait (Darkvision, Dwarven Resilience...), incl. descriptions
export const raceTraits = ref([])

// Full info for traits you PICKED, e.g. 'Draconic Ancestry (Black)' (it knows the damage type)
export const chosenTraits = ref([])



// Called by the race <select> in the top part
export async function selectRace(index) {
  const chosenRace = await fetchRaceDetails(index)
  selectedRace.value = chosenRace
  raceChoices.value = []


  chosenTraits.value = []
  raceTraits.value = await Promise.all(chosenRace.traits.map((trait) => fetchTrait(trait.index)))


  // Some traits make you choose: a dragonborn's dragon colour, a dwarf's tool, a half-elf's 2 skills.
  // We give each one the trait's name as its title in the popup.
  const traitChoices = raceTraits.value.flatMap((trait) => {
    const choices = []
    if (trait.trait_specific?.subtrait_options) {
      choices.push({ ...trait.trait_specific.subtrait_options, type: 'traits', desc: trait.name })
    }
    if (trait.proficiency_choices) {
      choices.push({ ...trait.proficiency_choices, desc: trait.name })
    }
    return choices
  })

  // Races without any choices (most of them) skip the popup
  const choices = [chosenRace.ability_bonus_options, chosenRace.language_options, ...traitChoices].filter(Boolean)


  raceChoices.value = await askChoices(`${chosenRace.name}: pick your extras`, choices)

  const pickedTraits = raceChoices.value.filter((grant) => grant.type === 'traits')
  chosenTraits.value = await Promise.all(pickedTraits.map((trait) => fetchTrait(trait.index)))
}

// Left part: how much the race adds to an ability, e.g. raceBonus('con') -> 2 for a dwarf
export function raceBonus(abilityIndex) {
  if (!selectedRace.value) return 0
  const always = selectedRace.value.ability_bonuses
    .filter((bonus) => bonus.ability_score.index === abilityIndex)
    .reduce((total, bonus) => total + bonus.bonus, 0)
  const picked = raceChoices.value
    .filter((grant) => grant.type === 'ability_bonuses' && grant.index === abilityIndex)
    .reduce((total, grant) => total + grant.bonus, 0)
  return always + picked
}

// Everything the race makes you proficient in: from traits (an elf's Perception, a dwarf's axes)
// and from picks (a dwarf's tool, a half-elf's skills)
const allRaceProficiencies = computed(() => [
  ...raceTraits.value.flatMap((trait) => trait.proficiencies),
  ...raceChoices.value.filter((grant) => grant.type === 'proficiencies'),
])

// Skills: does your race make you good at this one? e.g. hasRaceSkill('intimidation') for a half-orc
export function hasRaceSkill(skillIndex) {
  return allRaceProficiencies.value.some((prof) => prof.index === `skill-${skillIndex}`)
}

// Left part: weapons and tools from your race (skills get checkboxes instead)
export const raceProficiencies = computed(() =>
  allRaceProficiencies.value
    .filter((prof) => !prof.index.startsWith('skill-'))
    .map((prof) => prof.name)
    .join('\n'),
)


// Left part: languages the race can speak (always-get + picked)
export const raceLanguages = computed(() => {
  if (!selectedRace.value) return ''
  const picked = raceChoices.value.filter((grant) => grant.type === 'languages')
  return [...selectedRace.value.languages, ...picked].map((lang) => `Language: ${lang.name}`).join('\n')
})

// Right part: every race trait with what it does, e.g.
//   Darkvision: You have superior vision in dark and dim conditions...
//   Dwarven Resilience: ...you have resistance against poison damage.
export const raceTraitsText = computed(() => {
  if (!selectedRace.value || raceTraits.value.length === 0) return ''
  const lines = [`${selectedRace.value.name} traits`]

  for (const trait of raceTraits.value) {
    lines.push(`${trait.name}: ${trait.desc.join(' ')}`)

    // Show what you picked for this trait, e.g. the dragon colour and what damage it means
    const picked = chosenTraits.value.filter((chosen) => chosen.parent?.index === trait.index)
    for (const chosen of picked) {
      const damage = chosen.trait_specific?.damage_type?.name
      lines.push(damage ? `   -> ${chosen.name}: ${damage} damage` : `   -> ${chosen.name}`)
    }
  }

  // A dragonborn's resistance depends on the colour they picked, so spell it out
  const resistance = chosenTraits.value.find((chosen) => chosen.trait_specific?.damage_type)
  if (resistance) {
    lines.push(`Resistance: ${resistance.trait_specific.damage_type.name} damage (from your ancestry)`)
  }
  return lines.join('\n')
})

// Middle part: walking speed in feet
export const Speed = computed(() => {
  if (!selectedRace.value) return ''
  return selectedRace.value.speed
})
