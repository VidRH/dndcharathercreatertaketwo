import { ref } from 'vue'

// The character's name. Shared, because it shows on the character sheet AND the background page,
// so typing it in one place fills in the other.
export const characterName = ref('')
