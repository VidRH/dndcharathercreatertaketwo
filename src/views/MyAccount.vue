<script setup>
import { ref, computed, onUnmounted } from 'vue'
import {
  currentProfile,
  updateMyProfile,
  uploadProfilePicture,
  removeProfilePicture,
  pictureProblem,
} from '@/components/modules/useProfile.js'
import { useRouter } from 'vue-router'
import { changePassword, logOut } from '@/components/modules/useAuth.js'
import { deleteAccountEverywhere } from '@/components/modules/useCloudFunctions.js'
import ProfilePicture from '@/components/Account/ProfilePicture.vue'

const router = useRouter()

const roleNames = { player: 'Player', dm: 'Dungeon Master', admin: 'Admin' }

const memberSince = computed(() => {
  const createdAt = currentProfile.value?.createdAt
  // From Firestore it's a Timestamp, a profile made just now has a normal Date
  const date = createdAt?.toDate ? createdAt.toDate() : createdAt
  return date ? date.toLocaleDateString() : ''
})

// ---------- editing the profile ----------

// The form works on a copy, so Cancel just throws the copy away
const editing = ref(false)
const form = ref({ displayName: '', description: '', role: 'player' })
const newPicture = ref(null) // the file picked, not uploaded until Save
const previewUrl = ref('') // a temporary link so the picked file shows before it's uploaded
const removePicture = ref(false)
const saving = ref(false)
const error = ref('')

// What the picture in the form shows right now
const formPictureUrl = computed(() => {
  if (previewUrl.value) return previewUrl.value
  if (removePicture.value) return ''
  return currentProfile.value.photoURL
})

function startEditing() {
  const profile = currentProfile.value
  form.value = {
    displayName: profile.displayName,
    description: profile.description ?? '',
    role: profile.role,
  }
  clearNewPicture()
  removePicture.value = false
  error.value = ''
  editing.value = true
}

function cancelEditing() {
  clearNewPicture()
  editing.value = false
}

function onPictureChosen(event) {
  const file = event.target.files[0]
  event.target.value = '' // so picking the same file again still counts as a change
  if (!file) return

  const problem = pictureProblem(file)
  if (problem) {
    error.value = problem
    return
  }

  clearNewPicture()
  error.value = ''
  newPicture.value = file
  previewUrl.value = URL.createObjectURL(file)
  removePicture.value = false
}

function onRemovePicture() {
  clearNewPicture()
  removePicture.value = true
}

// Temporary links keep the file in memory until they're let go of
function clearNewPicture() {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  previewUrl.value = ''
  newPicture.value = null
}
onUnmounted(clearNewPicture)

async function save() {
  const displayName = form.value.displayName.trim()
  if (!displayName) {
    error.value = "Your name can't be empty."
    return
  }

  saving.value = true
  error.value = ''
  try {
    if (newPicture.value) await uploadProfilePicture(newPicture.value)
    else if (removePicture.value && currentProfile.value.photoURL) await removeProfilePicture()

    const changes = { displayName, description: form.value.description.trim() }
    // Admins don't get the switch, their role stays as it is
    if (currentProfile.value.role !== 'admin') changes.role = form.value.role
    await updateMyProfile(changes)

    clearNewPicture()
    editing.value = false
  } catch (e) {
    error.value = e.message
  } finally {
    saving.value = false
  }
}

// ---------- changing the password ----------

// The password form only shows after pressing "Change password"
const showPasswordForm = ref(false)
const passwords = ref({ current: '', new: '', confirm: '' })
const passwordError = ref('')
const passwordDone = ref(false)
const changingPassword = ref(false)

function openPasswordForm() {
  passwordError.value = ''
  passwordDone.value = false
  showPasswordForm.value = true
}

function closePasswordForm() {
  passwords.value = { current: '', new: '', confirm: '' }
  passwordError.value = ''
  showPasswordForm.value = false
}

async function onChangePassword() {
  passwordError.value = ''
  passwordDone.value = false

  if (passwords.value.new !== passwords.value.confirm) {
    passwordError.value = "The new passwords don't match."
    return
  }

  changingPassword.value = true
  try {
    await changePassword(passwords.value.current, passwords.value.new)
    closePasswordForm()
    passwordDone.value = true
  } catch (e) {
    // Firebase's own message for a wrong password is not very readable
    passwordError.value = ['auth/invalid-credential', 'auth/wrong-password'].includes(e.code)
      ? 'Your current password is wrong.'
      : e.message
  } finally {
    changingPassword.value = false
  }
}

// ---------- deleting the account ----------

const deletingAccount = ref(false)
const deleteError = ref('')

async function onDeleteAccount() {
  const warning =
    'Delete your account for good?\n\n' +
    'Your characters, the campaigns you run (for your players too) and your place in other campaigns ' +
    "will all be gone. This can't be undone."
  if (!confirm(warning)) return

  deletingAccount.value = true
  deleteError.value = ''
  try {
    await deleteAccountEverywhere(currentProfile.value.uid)
    // The login is gone on Firebase's side, this also forgets it in the browser
    await logOut()
    router.push('/')
  } catch (e) {
    deleteError.value = e.message
    deletingAccount.value = false
  }
}
</script>

<template>
  <main class="flex flex-col gap-4 max-w-3xl mx-auto p-4">
    <h1 class="text-2xl uppercase">My Account</h1>

    <p v-if="!currentProfile">Loading your account...</p>

    <template v-else>
      <!-- ---------- looking at the profile ---------- -->
      <section v-if="!editing" class="border-2 border-black rounded-md p-4 flex flex-col sm:flex-row gap-4">
        <ProfilePicture :url="currentProfile.photoURL" :name="currentProfile.displayName" size="w-28 h-28 text-5xl" class="self-center sm:self-start" />

        <div class="flex flex-col gap-1 grow min-w-0">
          <p class="text-2xl font-bold break-words">{{ currentProfile.displayName }}</p>
          <p>
            <span class="bg-dark text-white rounded-md px-2 py-0.5 text-sm uppercase">{{ roleNames[currentProfile.role] }}</span>
          </p>
          <p class="text-sm break-all">{{ currentProfile.email }}</p>
          <p v-if="memberSince" class="text-xs text-gray-500">member since {{ memberSince }}</p>
          <!-- whitespace-pre-line keeps the line breaks you typed -->
          <p v-if="currentProfile.description" class="mt-2 whitespace-pre-line break-words">{{ currentProfile.description }}</p>
          <p v-else class="mt-2 text-gray-500">No description yet.</p>

          <p v-if="passwordDone" class="self-end mt-2 text-green-700">Your password has been changed.</p>
          <div class="self-end mt-2 flex flex-wrap justify-end gap-2">
            <button v-if="!showPasswordForm" @click="openPasswordForm" class="border-2 border-black rounded-md px-4 py-1 cursor-pointer">
              Change password
            </button>
            <button @click="startEditing" class="border-2 border-black rounded-md px-4 py-1 cursor-pointer bg-black text-white">
              Edit profile
            </button>
          </div>
        </div>
      </section>

      <!-- ---------- editing the profile ---------- -->
      <form v-else @submit.prevent="save" class="border-2 border-black rounded-md p-4 flex flex-col gap-3">
        <div class="flex flex-col sm:flex-row gap-4 items-center sm:items-start">
          <ProfilePicture :url="formPictureUrl" :name="form.displayName" size="w-28 h-28 text-5xl" />
          <div class="flex flex-col gap-2">
            <!-- a label around a hidden file input, so the button can look like the others -->
            <label class="border-2 border-black rounded-md px-4 py-1 cursor-pointer text-center">
              Choose picture
              <input type="file" accept="image/*" @change="onPictureChosen" class="hidden" />
            </label>
            <button v-if="formPictureUrl" type="button" @click="onRemovePicture" class="text-sm text-red-600 cursor-pointer">
              Remove picture
            </button>
            <p class="text-xs text-gray-500">An image, smaller than 2 MB.</p>
          </div>
        </div>

        <label class="flex flex-col gap-1">
          Name
          <input v-model="form.displayName" type="text" required maxlength="40" class="border p-2" />
        </label>

        <label class="flex flex-col gap-1">
          Description
          <textarea v-model="form.description" rows="4" maxlength="500" placeholder="Tell people a bit about yourself" class="border p-2"></textarea>
        </label>

        <fieldset v-if="currentProfile.role !== 'admin'" class="border p-2 flex flex-col gap-1">
          <legend class="px-1">Account type</legend>
          <label class="flex items-center gap-2 cursor-pointer">
            <input v-model="form.role" type="radio" value="player" />
            Player: make characters and join campaigns
          </label>
          <label class="flex items-center gap-2 cursor-pointer">
            <input v-model="form.role" type="radio" value="dm" />
            Dungeon Master: all of that, plus run my own campaigns
          </label>
          <p v-if="currentProfile.role === 'dm' && form.role === 'player'" class="text-xs text-gray-500">
            Your campaigns are kept, you just can't open them until you switch back.
          </p>
        </fieldset>

        <p v-if="error" class="text-red-600">{{ error }}</p>

        <div class="flex justify-end gap-2">
          <button type="button" @click="cancelEditing" :disabled="saving" class="border-2 border-black rounded-md px-4 py-1 cursor-pointer">
            Cancel
          </button>
          <button type="submit" :disabled="saving" class="border-2 border-black rounded-md px-4 py-1 cursor-pointer bg-black text-white disabled:opacity-50">
            {{ saving ? 'Saving...' : 'Save' }}
          </button>
        </div>
      </form>

      <!-- ---------- password ---------- -->
      <form v-if="showPasswordForm" @submit.prevent="onChangePassword" class="border-2 border-black rounded-md p-4 flex flex-col gap-2">
        <h2 class="text-xl uppercase">Change password</h2>
        <input v-model="passwords.current" type="password" placeholder="Current password" required autocomplete="current-password" class="border p-2" />
        <input v-model="passwords.new" type="password" placeholder="New password (6+ chars)" required minlength="6" autocomplete="new-password" class="border p-2" />
        <input v-model="passwords.confirm" type="password" placeholder="Confirm new password" required minlength="6" autocomplete="new-password" class="border p-2" />
        <p v-if="passwordError" class="text-red-600">{{ passwordError }}</p>
        <div class="flex justify-end gap-2">
          <button type="button" @click="closePasswordForm" :disabled="changingPassword" class="border-2 border-black rounded-md px-4 py-1 cursor-pointer">
            Cancel
          </button>
          <button type="submit" :disabled="changingPassword" class="border-2 border-black rounded-md px-4 py-1 cursor-pointer bg-black text-white disabled:opacity-50">
            {{ changingPassword ? 'Changing...' : 'Change password' }}
          </button>
        </div>
      </form>

      <!-- kept apart and at the bottom, so nobody presses it by accident -->
      <section class="border-2 border-red-600 rounded-md p-4 flex flex-col gap-2">
        <h2 class="text-xl uppercase text-red-600">Delete account</h2>
        <p class="text-sm">
          Removes your login, profile, characters and the campaigns you run. Afterwards you can sign up again with the same email.
        </p>
        <p v-if="deleteError" class="text-red-600">{{ deleteError }}</p>
        <button @click="onDeleteAccount" :disabled="deletingAccount" class="self-end border-2 border-red-600 text-red-600 rounded-md px-4 py-1 cursor-pointer disabled:opacity-50">
          {{ deletingAccount ? 'Deleting...' : 'Delete my account' }}
        </button>
      </section>
    </template>
  </main>
</template>
