import { ref } from 'vue'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { auth } from '@/firebase'
import { loadProfile, clearProfile } from './useProfile.js'

// Who is logged in right now (null = nobody). Lives outside of any component,
// so every component that imports it sees the same user.
export const currentUser = ref(null)

// On a page refresh Firebase needs a moment to remember who was logged in.
// Until then currentUser is null even if you ARE logged in.
// This promise finishes after that first check, so the router guard can wait for it.
let markAuthReady
export const authReady = new Promise((resolve) => {
  markAuthReady = resolve
})

// Firebase calls this on startup and every time someone logs in or out
onAuthStateChanged(auth, async (user) => {
  currentUser.value = user

  if (user) {
    // Also get their profile (name, role...) so the pages and the router know what they may see.
    // A failed fetch must not stop markAuthReady below, or every page would wait forever.
    try {
      await loadProfile(user)
    } catch (e) {
      console.error('Could not load your profile:', e)
    }
  } else {
    clearProfile()
  }

  markAuthReady()
})

export async function logOut() {
  await signOut(auth)
}
