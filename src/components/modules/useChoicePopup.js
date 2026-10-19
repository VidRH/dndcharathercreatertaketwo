import { ref } from 'vue'
import { fetchEquipmentCategory, fetchListByUrl } from './useClassRaceAlignApi.js'

// What's currently shown in the popup. null = popup is closed.
// Looks like: { title, questions, resolve }
export const popup = ref(null)

// Nicer titles for choices that don't come with a description
const typeTitles = {
  languages: 'Languages',
  ability_bonuses: 'Ability score bonuses',
  equipment: 'Equipment',
  proficiencies: 'Proficiencies',
}

// ---------------------------------------------------------------------------
// Step 1: turn the API's messy choice data into simple "questions"
//
// A question looks like:
//   { title, type, choose, hint, fixed, selected: [], options: [...] }
// An option looks like:
//   { label, grants: [...things you get...], picks: [...dropdowns...] }
// A grant (a thing you get) looks like:
//   { type: 'equipment' | 'proficiencies' | 'languages' | 'ability_bonuses', index, name, count, bonus }
// ---------------------------------------------------------------------------

// Gets the list behind "pick from Martial Weapons" or "pick from all languages"
async function listFrom(from) {
  if (from.option_set_type === 'equipment_category') {
    const category = await fetchEquipmentCategory(from.equipment_category.index)
    return category.equipment
  }
  if (from.option_set_type === 'resource_list') {
    return fetchListByUrl(from.resource_list_url)
  }
  // options_array: a plain list of things like skills or tools
  return from.options.map((option) => option.item ?? option.of)
}

// "pick 2" becomes two dropdowns, each with the whole list in it
function makePicks(list, howMany, type, label) {
  return Array.from({ length: howMany }, () => ({ label, type, list, value: '' }))
}

// Turns ONE option, like "(b) leather armor, longbow, and 20 arrows", into { label, grants, picks }
async function buildOption(option, type) {
  // Some level-up choices are just plain words, e.g. a ranger's favored enemy 'undead'
  if (typeof option === 'string') {
    const name = option.charAt(0).toUpperCase() + option.slice(1)
    return { label: name, grants: [{ type, index: option, name, count: 1 }], picks: [] }
  }

  switch (option.option_type) {
    case 'counted_reference': // e.g. 20x Arrow
      return {
        label: `${option.count}x ${option.of.name}`,
        grants: [{ type, index: option.of.index, name: option.of.name, count: option.count }],
        picks: [],
      }
    case 'reference': // e.g. Skill: Athletics, or the language Dwarvish
      return {
        label: option.item.name,
        grants: [{ type, index: option.item.index, name: option.item.name, count: 1 }],
        picks: [],
      }
    case 'ability_bonus': // e.g. DEX +1 (half-elf)
      return {
        label: `${option.ability_score.name} +${option.bonus}`,
        grants: [{ type, index: option.ability_score.index, name: option.ability_score.name, bonus: option.bonus }],
        picks: [],
      }
    case 'choice': { // e.g. "a martial weapon" -> you get a dropdown to pick which one
      const inner = option.choice
      const list = await listFrom(inner.from)
      return { label: inner.desc, grants: [], picks: makePicks(list, inner.choose, inner.type, inner.desc) }
    }
    case 'multiple': { // e.g. "a martial weapon AND a shield" -> glue the parts together
      const parts = await Promise.all(option.items.map((item) => buildOption(item, type)))
      return {
        label: parts.map((part) => part.label).join(' + '),
        grants: parts.flatMap((part) => part.grants),
        picks: parts.flatMap((part) => part.picks),
      }
    }
    default:
      return { label: option.string ?? '?', grants: [], picks: [] }
  }
}

// Turns ONE choice from the API into a question for the popup
// (also used by the level-up popup for things like Fighting Style)
export async function buildQuestion(choice) {
  const title = choice.desc ?? choice.from.equipment_category?.name ?? typeTitles[choice.type] ?? choice.type

  if (choice.from.option_set_type === 'options_array') {
    // "(a) this or (b) that" -> tick boxes
    const options = await Promise.all(choice.from.options.map((option) => buildOption(option, choice.type)))
    return { title, type: choice.type, choose: choice.choose, hint: `choose ${choice.choose}`, fixed: false, selected: [], options }
  }

  // "pick 2 from this big list" -> one option that is already ticked, with dropdowns
  const list = await listFrom(choice.from)
  const option = { label: '', grants: [], picks: makePicks(list, choice.choose, choice.type, title) }
  return { title, type: choice.type, choose: 1, hint: `pick ${choice.choose}`, fixed: true, selected: [0], options: [option] }
}

// ---------------------------------------------------------------------------
// Step 2: open the popup and WAIT until the player presses Confirm
// ---------------------------------------------------------------------------

// Usage: const stuffYouGot = await askChoices('Fighter', fighter.starting_equipment_options)
export async function askChoices(title, apiChoices) {
  if (apiChoices.length === 0) return [] // nothing to choose -> no popup

  const questions = await Promise.all(apiChoices.map(buildQuestion))

  // A Promise is like an IOU: "I'll give you the answer later".
  // We keep its resolve function, and confirmPopup() calls it when the player is done.
  return new Promise((resolve) => {
    popup.value = { title, questions, resolve }
  })
}

// Is every question answered? (right amount ticked, and every dropdown filled in)
export function isQuestionDone(question) {
  return (
    question.selected.length === question.choose &&
    question.selected.every((i) => question.options[i].picks.every((pick) => pick.value !== ''))
  )
}

// Tick/untick an option. With "choose 1" picking a new one swaps it, like a radio button.
export function toggleOption(question, i) {
  if (question.selected.includes(i)) {
    question.selected = question.selected.filter((x) => x !== i)
  } else if (question.choose === 1) {
    question.selected = [i]
  } else if (question.selected.length < question.choose) {
    question.selected.push(i)
  }
}

// A dropdown changed, e.g. "a martial weapon" -> 'longsword'
export function setPick(pick, value) {
  pick.value = value
}

// Collect everything the player ticked/picked into one flat list of grants
export function collectGrants(questions) {
  return questions.flatMap((question) =>
    question.selected.flatMap((i) => {
      const option = question.options[i]
      const picked = option.picks.map((pick) => {
        const item = pick.list.find((thing) => thing.index === pick.value)
        return { type: pick.type, index: item.index, name: item.name, count: 1 }
      })
      return [...option.grants, ...picked]
    }),
  )
}

export function confirmPopup() {
  const { questions, resolve } = popup.value
  popup.value = null
  resolve(collectGrants(questions))
}

// Closing without choosing = you just get nothing extra
export function cancelPopup() {
  const { resolve } = popup.value
  popup.value = null
  resolve([])
}
