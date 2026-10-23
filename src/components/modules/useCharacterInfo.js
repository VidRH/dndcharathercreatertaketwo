import { ref } from 'vue'

// The character's name. Shared, because it shows on the character sheet AND the background page,
// so typing it in one place fills in the other.
export const characterName = ref('')

// The other things you just TYPE or tick on the sheet (no API, no rules).
// They live out here instead of only in the inputs, so useCharacterData.js can save and load them.

// Top part
export const playerName = ref('')
export const alignment = ref('') // alignment index from the API, e.g. 'chaotic-good'

// Left part
export const inspiration = ref(false)

// Right part
export const personalityTraits = ref('')
export const ideals = ref('')
export const bonds = ref('')
export const flaws = ref('')

// Background page: looks
export const age = ref('')
export const height = ref('')
export const weight = ref('')
export const eyes = ref('')
export const hair = ref('')
export const skin = ref('')

// Background page: the big text boxes
export const appearance = ref('')
export const backstory = ref('')
export const allies = ref('')
export const symbols = ref('')
export const additionalFeatures = ref('')
export const treasure = ref('')
