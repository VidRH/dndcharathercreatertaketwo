import { ref, computed } from 'vue'
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
// "ref" is already Vue's ref, so Storage's one gets another name
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { db, auth, storage } from '@/firebase'

// The logged in user's profile from Firestore: users/{uid}
// { uid, displayName, description, photoURL, photoPath, email, role, createdAt }
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

// Saves changes to your own profile, e.g. { displayName, description, role }
export async function updateMyProfile(changes) {
  await updateDoc(doc(db, 'users', auth.currentUser.uid), changes)
  // Change our copy too, so the nav bar and pages update without fetching again
  currentProfile.value = { ...currentProfile.value, ...changes }
}

export const MAX_PICTURE_SIZE = 2 * 1024 * 1024 // 2 MB, storage.rules checks the same

// What's wrong with a picture someone picked, or '' if it's fine
export function pictureProblem(file) {
  if (!file.type.startsWith('image/')) return 'That file is not an image.'
  if (file.size > MAX_PICTURE_SIZE) return 'The picture must be smaller than 2 MB.'
  return ''
}

// Uploads a new profile picture to Storage and puts its link in the profile
export async function uploadProfilePicture(file) {
  const problem = pictureProblem(file)
  if (problem) throw new Error(problem)

  const oldPath = currentProfile.value?.photoPath
  // A new file name every time, otherwise browsers keep showing the old picture they remember
  const path = `avatars/${auth.currentUser.uid}/${Date.now()}`
  const fileRef = storageRef(storage, path)

  await uploadBytes(fileRef, file, { contentType: file.type })
  const photoURL = await getDownloadURL(fileRef)
  await updateMyProfile({ photoURL, photoPath: path })

  if (oldPath) await deletePictureFile(oldPath)
}

export async function removeProfilePicture() {
  const oldPath = currentProfile.value?.photoPath
  await updateMyProfile({ photoURL: '', photoPath: '' })
  if (oldPath) await deletePictureFile(oldPath)
}

// The old file is just clutter at this point, so if deleting it fails we don't bother the user
async function deletePictureFile(path) {
  try {
    await deleteObject(storageRef(storage, path))
  } catch (e) {
    console.warn('Could not delete the old picture:', e)
  }
}
