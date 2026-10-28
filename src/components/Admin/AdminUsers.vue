<script setup>
import { ref, computed, onMounted } from 'vue'
import { listAllUsers, updateUserAsAdmin, removeUserPicture } from '@/components/modules/useAdmin.js'
import { deleteAccountEverywhere } from '@/components/modules/useCloudFunctions.js'
import { currentProfile } from '@/components/modules/useProfile.js'
import ProfilePicture from '@/components/Account/ProfilePicture.vue'

// The Users tab of the admin page: every account, to look at, edit or delete
const roleNames = { player: 'Player', dm: 'Dungeon Master', admin: 'Admin' }

const users = ref([])
const loading = ref(true)
const error = ref('')
const search = ref('')

onMounted(async () => {
  try {
    users.value = await listAllUsers()
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
})

const myUid = computed(() => currentProfile.value?.uid)

// Search by name or email
const shownUsers = computed(() => {
  const text = search.value.trim().toLowerCase()
  if (!text) return users.value
  return users.value.filter(
    (user) => (user.displayName ?? '').toLowerCase().includes(text) || (user.email ?? '').toLowerCase().includes(text),
  )
})

// Puts a changed user back in the list (and in the nav bar, if it's you)
function replaceUser(uid, changes) {
  users.value = users.value.map((user) => (user.uid === uid ? { ...user, ...changes } : user))
  if (uid === myUid.value) currentProfile.value = { ...currentProfile.value, ...changes }
}

// ---------- editing ----------

const editingUid = ref(null)
const form = ref({ displayName: '', description: '', role: 'player' })
const saving = ref(false)
const editError = ref('')

function startEditing(user) {
  form.value = { displayName: user.displayName ?? '', description: user.description ?? '', role: user.role ?? 'player' }
  editError.value = ''
  editingUid.value = user.uid
}

async function save(user) {
  const changes = { ...form.value, displayName: form.value.displayName.trim(), description: form.value.description.trim() }
  if (!changes.displayName) {
    editError.value = "The name can't be empty."
    return
  }
  if (user.uid === myUid.value && user.role === 'admin' && changes.role !== 'admin') {
    if (!confirm("You're taking away your own admin rights. You won't be able to come back to this page. Go on?")) return
  }

  saving.value = true
  editError.value = ''
  try {
    await updateUserAsAdmin(user.uid, changes)
    replaceUser(user.uid, changes)
    editingUid.value = null
  } catch (e) {
    editError.value = e.message
  } finally {
    saving.value = false
  }
}

async function onRemovePicture(user) {
  if (!confirm(`Remove ${user.displayName}'s profile picture?`)) return
  editError.value = ''
  try {
    await removeUserPicture(user.uid, user.photoPath)
    replaceUser(user.uid, { photoURL: '', photoPath: '' })
  } catch (e) {
    editError.value = e.message
  }
}

// ---------- deleting ----------

const deletingUid = ref(null)

async function onDelete(user) {
  const warning =
    `Delete ${user.displayName} (${user.email})?\n\n` +
    'This removes their login, profile, characters and the campaigns they run, and takes them out of ' +
    "other campaigns. It can't be undone. Their email can be used to sign up again."
  if (!confirm(warning)) return

  deletingUid.value = user.uid
  error.value = ''
  try {
    await deleteAccountEverywhere(user.uid)
    users.value = users.value.filter((other) => other.uid !== user.uid)
  } catch (e) {
    error.value = e.message
  } finally {
    deletingUid.value = null
  }
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <input v-model="search" type="search" placeholder="Search by name or email" class="border p-2" />

    <p v-if="loading">Loading the accounts...</p>
    <p v-if="error" class="text-red-600">{{ error }}</p>
    <p v-if="!loading && shownUsers.length === 0">No accounts found.</p>

    <div v-for="user in shownUsers" :key="user.uid" class="border-2 border-black rounded-md p-3 flex flex-col gap-2">
      <div class="flex items-center gap-3">
        <ProfilePicture :url="user.photoURL" :name="user.displayName" size="w-12 h-12 text-xl" />
        <div class="min-w-0 grow">
          <p class="text-xl font-bold break-words">
            {{ user.displayName }}
            <span v-if="user.uid === myUid" class="text-sm font-normal text-gray-500">(you)</span>
          </p>
          <p class="text-sm break-all">{{ user.email }}</p>
        </div>
        <span class="bg-dark text-white rounded-md px-2 py-0.5 text-sm uppercase whitespace-nowrap">{{ roleNames[user.role] ?? user.role }}</span>
      </div>
      <p v-if="user.createdAt" class="text-xs text-gray-500">member since {{ user.createdAt.toLocaleDateString() }}</p>

      <!-- ---------- edit form ---------- -->
      <form v-if="editingUid === user.uid" @submit.prevent="save(user)" class="flex flex-col gap-2 border-t pt-2">
        <label class="flex flex-col gap-1">
          Name
          <input v-model="form.displayName" type="text" required maxlength="40" class="border p-2" />
        </label>
        <label class="flex flex-col gap-1">
          Description
          <textarea v-model="form.description" rows="3" maxlength="500" class="border p-2"></textarea>
        </label>
        <label class="flex flex-col gap-1">
          Account type
          <select v-model="form.role" class="border p-2">
            <option value="player">Player</option>
            <option value="dm">Dungeon Master</option>
            <option value="admin">Admin</option>
          </select>
        </label>
        <button v-if="user.photoURL" type="button" @click="onRemovePicture(user)" class="self-start text-sm text-red-600 cursor-pointer">
          Remove profile picture
        </button>
        <p v-if="editError" class="text-red-600">{{ editError }}</p>
        <div class="flex justify-end gap-2">
          <button type="button" @click="editingUid = null" :disabled="saving" class="border-2 border-black rounded-md px-4 py-1 cursor-pointer">
            Cancel
          </button>
          <button type="submit" :disabled="saving" class="border-2 border-black rounded-md px-4 py-1 cursor-pointer bg-black text-white disabled:opacity-50">
            {{ saving ? 'Saving...' : 'Save' }}
          </button>
        </div>
      </form>

      <template v-else>
        <p v-if="user.description" class="whitespace-pre-line break-words text-sm">{{ user.description }}</p>
        <div class="flex justify-end gap-3">
          <!-- your own account is deleted from My Account, so it can't happen here by accident -->
          <button
            v-if="user.uid !== myUid"
            @click="onDelete(user)"
            :disabled="deletingUid !== null"
            class="text-sm text-red-600 cursor-pointer disabled:opacity-50"
          >
            {{ deletingUid === user.uid ? 'Deleting...' : 'Delete' }}
          </button>
          <button @click="startEditing(user)" class="text-sm underline cursor-pointer">Edit</button>
        </div>
      </template>
    </div>
  </div>
</template>
