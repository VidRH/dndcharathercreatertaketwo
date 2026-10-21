import { ref } from 'vue'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { auth } from '@/firebase'

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
onAuthStateChanged(auth, (user) => {
  currentUser.value = user
  markAuthReady()
})

export async function logOut() {
  await signOut(auth)
}
