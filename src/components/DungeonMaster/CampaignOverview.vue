<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, onBeforeRouteLeave } from 'vue-router'
import { saveCampaign, deleteCampaign } from '@/components/modules/useCampaigns.js'

// The Overview tab: name, descriptions and DM notes of one campaign
const props = defineProps({
  campaign: { type: Object, required: true },
})
// 'saved' tells the campaign page the new values, so its header shows the new name
const emit = defineEmits(['saved'])

const router = useRouter()

function fieldsOf(campaign) {
  return {
    name: campaign.name ?? '',
    shortDescription: campaign.shortDescription ?? '',
    longDescription: campaign.longDescription ?? '',
    notes: campaign.notes ?? '',
  }
}

// The fields are always editable. "saved" is what's in Firestore, so we can tell if anything changed.
const form = ref(fieldsOf(props.campaign))
const saved = ref(fieldsOf(props.campaign))
const hasChanges = computed(() => JSON.stringify(form.value) !== JSON.stringify(saved.value))

const saving = ref(false)
const error = ref('')
const justSaved = ref(false)

async function save() {
  const fields = { ...form.value, name: form.value.name.trim() }
  if (!fields.name) {
    error.value = "The campaign name can't be empty."
    return
  }

  saving.value = true
  error.value = ''
  try {
    await saveCampaign(props.campaign.id, fields)
    form.value = { ...fields }
    saved.value = { ...fields }
    justSaved.value = true
    emit('saved', fields)
  } catch (e) {
    error.value = e.message
  } finally {
    saving.value = false
  }
}

// Typing again hides the old "Saved" message
function onInput() {
  justSaved.value = false
}

// ---------- don't lose unsaved work ----------

let deleting = false

// Going to another page inside the app
onBeforeRouteLeave(() => {
  if (deleting || !hasChanges.value) return true
  return confirm('You have unsaved changes in this campaign. Leave anyway?')
})

// Closing the tab or refreshing: the browser shows its own "leave site?" question
function warnBeforeClosing(event) {
  if (hasChanges.value) event.preventDefault()
}
onMounted(() => window.addEventListener('beforeunload', warnBeforeClosing))
onUnmounted(() => window.removeEventListener('beforeunload', warnBeforeClosing))

// ---------- deleting ----------

const deleteError = ref('')

async function onDelete() {
  if (!confirm(`Delete ${props.campaign.name}? This can't be undone.`)) return
  deleteError.value = ''
  try {
    await deleteCampaign(props.campaign.id)
    deleting = true // so the unsaved-changes question doesn't pop up
    router.push('/DungeonMaster')
  } catch (e) {
    deleteError.value = e.message
  }
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <form @submit.prevent="save" @input="onInput" class="border-2 border-black rounded-md p-4 flex flex-col gap-3">
      <label class="flex flex-col gap-1">
        Name
        <input v-model="form.name" type="text" required maxlength="80" class="border p-2" />
      </label>

      <label class="flex flex-col gap-1">
        Short description
        <span class="text-xs text-gray-500">One or two sentences, shown on the campaign card.</span>
        <textarea v-model="form.shortDescription" rows="2" maxlength="200" class="border p-2"></textarea>
      </label>

      <label class="flex flex-col gap-1">
        Long description
        <span class="text-xs text-gray-500">The setting, the story so far... Players will be able to read this.</span>
        <textarea v-model="form.longDescription" rows="8" class="border p-2"></textarea>
      </label>

      <label class="flex flex-col gap-1">
        DM notes
        <span class="text-xs text-gray-500">Only you can ever see these.</span>
        <textarea v-model="form.notes" rows="8" class="border p-2 bg-paperdarker"></textarea>
      </label>

      <p v-if="error" class="text-red-600">{{ error }}</p>

      <div class="flex justify-end items-center gap-3">
        <span v-if="hasChanges" class="text-sm text-gray-500">Unsaved changes</span>
        <span v-else-if="justSaved" class="text-sm text-green-700">Saved</span>
        <button type="submit" :disabled="saving || !hasChanges" class="border-2 border-black rounded-md px-4 py-1 cursor-pointer bg-black text-white disabled:opacity-50 disabled:cursor-default">
          {{ saving ? 'Saving...' : 'Save' }}
        </button>
      </div>
    </form>

    <!-- kept apart and at the bottom, so nobody presses it by accident -->
    <section class="border-2 border-red-600 rounded-md p-4 flex flex-col gap-2">
      <h2 class="text-xl uppercase text-red-600">Delete campaign</h2>
      <p class="text-sm">This removes the campaign and everything in it for good.</p>
      <p v-if="deleteError" class="text-red-600">{{ deleteError }}</p>
      <button @click="onDelete" class="self-end border-2 border-red-600 text-red-600 rounded-md px-4 py-1 cursor-pointer">
        Delete campaign
      </button>
    </section>
  </div>
</template>
