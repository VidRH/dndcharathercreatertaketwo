import { ref, computed } from 'vue'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db, auth } from '@/firebase'

// The logged in user's profile from Firestore: users/{uid}
// { uid, displayName, description, photoURL, email, role, createdAt }
// role is 'player', 'dm' or 'admin'. Like currentUser it lives outside of any component,
// so every component that imports it sees the same profile.
export const currentProfile = ref(null)

// Admins can do everything, so they pass every role check
export function hasRole(roles) {
  const role = currentProfile.value?.role
  return role === 'admin' || roles.includes(role)
}

export const isDM = computed(() => hasRole(['dm']))
export const isAdmin = computed(() => currentProfile.value?.role === 'admin')

// The sign up page puts the name and role it asked for here BEFORE making the account.
// The moment the account exists useAuth notices the new login and makes the profile,
// and it picks these up instead of the defaults.
let signUpDetails = null
export function setSignUpDetails(details) {
  signUpDetails = details
}

// The profile that is being fetched right now, so useAuth and the router
// asking at the same time share one fetch instead of doing two
let loading = null // { uid, promise }

export function loadProfile(user) {
  if (loading?.uid === user.uid) return loading.promise

  const promise = fetchOrCreateProfile(user).catch((e) => {
    loading = null // so the next try fetches again instead of reusing the failure
    throw e
  })
  loading = { uid: user.uid, promise }
  return promise
}

export function clearProfile() {
  currentProfile.value = null
  loading = null
}

async function fetchOrCreateProfile(user) {
  const profileDoc = doc(db, 'users', user.uid)
  const saved = await getDoc(profileDoc)

  let profile
  if (saved.exists()) {
    profile = saved.data()
  } else {
    // A brand new account, or one made before profiles existed: give it a profile
    const newProfile = {
      displayName: signUpDetails?.displayName || user.email.split('@')[0],
      description: '',
      photoURL: '',
      email: user.email,
      role: signUpDetails?.role ?? 'player',
      createdAt: serverTimestamp(),
    }
    signUpDetails = null
    await setDoc(profileDoc, newProfile)
    // serverTimestamp() is only a placeholder until Firestore fills it in, so use "now" here
    profile = { ...newProfile, createdAt: new Date() }
  }

  // Only keep it if this user is still the one logged in (they could have logged out meanwhile)
  if (auth.currentUser?.uid === user.uid) {
    currentProfile.value = { uid: user.uid, ...profile }
  }
  return currentProfile.value
}
