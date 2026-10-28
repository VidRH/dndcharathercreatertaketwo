const API_ROOT = 'https://www.dnd5eapi.co'
const BASE_URL = `${API_ROOT}/api/2014`

// Monsters whose name contains the text, e.g. 'gob' -> Goblin, Hobgoblin
// Gives back [{ index: 'goblin', name: 'Goblin', url }, ...]
export async function searchMonsters(name) {
  const response = await fetch(`${BASE_URL}/monsters?name=${encodeURIComponent(name)}`)
  if (!response.ok) {
    throw new Error(`Failed to search monsters: ${response.status}`)
  }
  const data = await response.json()
  return data.results
}

// The full stat block of one monster, e.g. fetchMonster('goblin')
export async function fetchMonster(index) {
  const response = await fetch(`${BASE_URL}/monsters/${index}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch monster ${index}: ${response.status}`)
  }
  return toStatBlock(await response.json())
}

// The API sends a lot more than a stat block shows (links, ids, damage dice in pieces...).
// We keep only what's shown, already turned into readable text where that's easier.
// That keeps the encounter small, and Firestore happy (it refuses some shapes the API uses).
function toStatBlock(monster) {
  return {
    index: monster.index,
    name: monster.name,
    size: monster.size ?? '',
    type: monster.type ?? '',
    subtype: monster.subtype ?? '',
    alignment: monster.alignment ?? '',
    armorClass: (monster.armor_class ?? []).map((armorClass) => ({
      value: armorClass.value,
      note: armorNote(armorClass),
    })),
    hitPoints: monster.hit_points ?? 0,
    hitDice: monster.hit_points_roll ?? monster.hit_dice ?? '',
    speed: speedText(monster.speed ?? {}),
    abilities: {
      STR: monster.strength,
      DEX: monster.dexterity,
      CON: monster.constitution,
      INT: monster.intelligence,
      WIS: monster.wisdom,
      CHA: monster.charisma,
    },
    savingThrows: proficienciesStartingWith(monster, 'Saving Throw: '),
    skills: proficienciesStartingWith(monster, 'Skill: '),
    damageVulnerabilities: monster.damage_vulnerabilities ?? [],
    damageResistances: monster.damage_resistances ?? [],
    damageImmunities: monster.damage_immunities ?? [],
    conditionImmunities: (monster.condition_immunities ?? []).map((condition) => condition.name),
    senses: sensesText(monster.senses ?? {}),
    languages: monster.languages || '-',
    challengeRating: monster.challenge_rating ?? 0,
    proficiencyBonus: monster.proficiency_bonus ?? 0,
    xp: monster.xp ?? 0,
    specialAbilities: namedTexts(monster.special_abilities),
    actions: namedTexts(monster.actions),
    legendaryActions: namedTexts(monster.legendary_actions),
    reactions: namedTexts(monster.reactions),
    // desc is only there for some monsters, and once in a while it's a list of paragraphs
    description: Array.isArray(monster.desc) ? monster.desc.join('\n\n') : (monster.desc ?? ''),
  }
}

// e.g. 'natural armor', 'leather armor, shield', 'with Mage Armor'
function armorNote(armorClass) {
  switch (armorClass.type) {
    case 'natural':
      return 'natural armor'
    case 'armor':
      return (armorClass.armor ?? []).map((armor) => armor.name.toLowerCase()).join(', ')
    case 'spell':
      return `with ${armorClass.spell?.name ?? 'a spell'}`
    case 'condition':
      return `while ${armorClass.condition?.name?.toLowerCase() ?? 'in a condition'}`
    default:
      return '' // 'dex' = just its Dexterity, nothing to say
  }
}

// { walk: '0 ft.', fly: '40 ft.', hover: true } -> '0 ft., fly 40 ft. (hover)'
function speedText(speed) {
  return Object.entries(speed)
    .filter(([kind]) => kind !== 'hover')
    .map(([kind, distance]) => {
      if (kind === 'walk') return distance
      const hover = kind === 'fly' && speed.hover ? ' (hover)' : ''
      return `${kind} ${distance}${hover}`
    })
    .join(', ')
}

// { darkvision: '60 ft.', passive_perception: 9 } -> 'darkvision 60 ft., passive Perception 9'
function sensesText(senses) {
  return Object.entries(senses)
    .map(([sense, value]) => (sense === 'passive_perception' ? `passive Perception ${value}` : `${sense.replaceAll('_', ' ')} ${value}`))
    .join(', ')
}

// The API puts saving throws and skills in one list, named like 'Skill: Stealth'
function proficienciesStartingWith(monster, start) {
  return (monster.proficiencies ?? [])
    .filter((entry) => entry.proficiency.name.startsWith(start))
    .map((entry) => ({ name: entry.proficiency.name.slice(start.length), value: entry.value }))
}

// Abilities and actions: just the name (with how often it can be used) and the text
function namedTexts(list) {
  return (list ?? []).map((entry) => ({ name: entry.name + usageText(entry.usage), desc: entry.desc ?? '' }))
}

// e.g. ' (3/Day)', ' (Recharge 5-6)'
function usageText(usage) {
  if (!usage) return ''
  if (usage.type === 'per day') return ` (${usage.times}/Day)`
  if (usage.type === 'recharge on roll') {
    return usage.min_value >= 6 ? ' (Recharge 6)' : ` (Recharge ${usage.min_value}-6)`
  }
  if (usage.type === 'recharge after rest') return ` (Recharges after a ${(usage.rest_types ?? []).join(' or ')} rest)`
  return ''
}

// 0.125 -> '1/8', 0.25 -> '1/4', 0.5 -> '1/2', 3 -> '3'
export function challengeText(challengeRating) {
  const fractions = { 0.125: '1/8', 0.25: '1/4', 0.5: '1/2' }
  return fractions[challengeRating] ?? String(challengeRating)
}
