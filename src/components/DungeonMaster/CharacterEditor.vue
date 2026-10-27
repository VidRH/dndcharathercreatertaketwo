<script setup>
import { ref, computed, onMounted } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import {
  emptyCharacter,
  saveCampaignCharacter,
  getAlignmentNames,
  SHOWABLE_FIELDS,
} from '@/components/modules/useCampaignCharacters.js'
import VisibilityToggle from './VisibilityToggle.vue'
import StatusPicker from './StatusPicker.vue'

// The form for making or editing one campaign character
const props = defineProps({
  campaignId: { type: String, required: true },
  character: { type: Object, default: null }, // null = a new character
  allCharacters: { type: Array, default: () => [] }, // for picking connections
})
// saved gives back the character with its id, cancel = closed without saving
const emit = defineEmits(['saved', 'cancel'])

// A fresh copy for the form, so nothing changes in the list until Save.
// Starts from emptyCharacter() so older saves still get every field.
function startingValues() {
  const blank = emptyCharacter()
  const saved = props.character ?? {}
  const values = {}
  for (const key of Object.keys(blank)) values[key] = saved[key] ?? blank[key]
  values.visible = { ...blank.visible, ...saved.visible }
  values.connections = (saved.connections ?? []).map((connection) => ({
    characterId: connection.characterId ?? '',
    label: connection.label ?? '',
    text: connection.text ?? '',
  }))
  return values
}

const form = ref(startingValues())
const original = JSON.stringify(form.value)
const hasChanges = computed(() => JSON.stringify(form.value) !== original)

// Everyone else in the campaign, for the connection dropdowns
const otherCharacters = computed(() =>
  props.allCharacters.filter((other) => other.id !== props.character?.id),
)

function setAllVisible(visible) {
  for (const { key } of SHOWABLE_FIELDS) form.value.visible[key] = visible
}

// ---------- alignment ----------

const alignmentOptions = ref([])
const alignmentFailed = ref(false)

onMounted(async () => {
  try {
    const names = await getAlignmentNames()
    // keep an alignment that isn't in the API's list, so it doesn't vanish
    const current = form.value.alignment
    alignmentOptions.value = current && !names.includes(current) ? [...names, current] : names
  } catch (e) {
    console.error('Could not load alignments:', e)
    alignmentFailed.value = true // fall back to typing it
  }
})

// ---------- connections ----------

function addConnection() {
  form.value.connections.push({ characterId: '', label: '', text: '' })
}

function removeConnection(index) {
  form.value.connections.splice(index, 1)
}

// ---------- saving ----------

const saving = ref(false)
const error = ref('')
let done = false // saved, so leaving is fine now

async function save() {
  const name = form.value.name.trim()
  if (!name) {
    error.value = 'Give the character a name.'
    return
  }

  const character = {
    ...form.value,
    name,
    affiliation: form.value.affiliation.trim(),
    // rows where nothing was filled in are dropped
    connections: form.value.connections
      .map((connection) => ({ ...connection, label: connection.label.trim(), text: connection.text.trim() }))
      .filter((connection) => connection.characterId || connection.label || connection.text),
  }

  saving.value = true
  error.value = ''
  try {
    const id = await saveCampaignCharacter(props.campaignId, props.character?.id ?? null, character)
    done = true
    emit('saved', { ...props.character, ...character, id })
  } catch (e) {
    error.value = e.message
    saving.value = false
  }
}

function cancel() {
  if (hasChanges.value && !confirm('Throw away your changes to this character?')) return
  done = true
  emit('cancel')
}

onBeforeRouteLeave(() => {
  if (done || !hasChanges.value) return true
  return confirm('You have unsaved changes to this character. Leave anyway?')
})
</script>

<template>
  <form @submit.prevent="save" class="border-2 border-black rounded-md p-4 flex flex-col gap-4">
    <div class="flex flex-wrap justify-between items-center gap-2">
      <h2 class="text-xl uppercase">{{ character ? 'Edit character' : 'New character' }}</h2>
      <div class="flex gap-3 text-sm">
        <button type="button" @click="setAllVisible(true)" class="underline cursor-pointer">Show all</button>
        <button type="button" @click="setAllVisible(false)" class="underline cursor-pointer">Hide all</button>
      </div>
    </div>
    <p class="text-xs text-gray-500 -mt-3">
      Everything starts hidden. Players only ever see the parts marked "Shown to players".
    </p>

    <!-- name -->
    <div class="flex flex-col gap-1">
      <div class="flex justify-between items-center gap-2">
        <label for="character-name">Name</label>
        <VisibilityToggle v-model="form.visible.name" />
      </div>
      <input id="character-name" v-model="form.name" type="text" required maxlength="80" class="border p-2" />
    </div>

    <!-- affiliation -->
    <div class="flex flex-col gap-1">
      <div class="flex justify-between items-center gap-2">
        <label for="character-affiliation">Affiliation</label>
        <VisibilityToggle v-model="form.visible.affiliation" />
      </div>
      <input id="character-affiliation" v-model="form.affiliation" type="text" maxlength="120" placeholder="e.g. The Harpers, the king's guard" class="border p-2" />
    </div>

    <!-- alignment -->
    <div class="flex flex-col gap-1">
      <div class="flex justify-between items-center gap-2">
        <label for="character-alignment">Alignment</label>
        <VisibilityToggle v-model="form.visible.alignment" />
      </div>
      <input v-if="alignmentFailed" id="character-alignment" v-model="form.alignment" type="text" maxlength="40" class="border p-2" />
      <select v-else id="character-alignment" v-model="form.alignment" class="border p-2">
        <option value="">None / unknown</option>
        <option v-for="alignment in alignmentOptions" :key="alignment" :value="alignment">{{ alignment }}</option>
      </select>
    </div>

    <!-- statuses: the truth, and what the players believe -->
    <div class="flex flex-col gap-1">
      <span>True status <span class="text-xs text-gray-500">(only you see this)</span></span>
      <StatusPicker v-model="form.dmStatus" />
    </div>

    <div class="flex flex-col gap-1">
      <div class="flex justify-between items-center gap-2">
        <span>Status players see</span>
        <VisibilityToggle v-model="form.visible.playerStatus" />
      </div>
      <StatusPicker v-model="form.playerStatus" />
    </div>

    <!-- connections -->
    <div class="flex flex-col gap-2">
      <div class="flex justify-between items-center gap-2">
        <span>Connections</span>
        <VisibilityToggle v-model="form.visible.connections" />
      </div>

      <p v-if="form.connections.length === 0" class="text-sm text-gray-500">No connections yet.</p>

      <div v-for="(connection, index) in form.connections" :key="index" class="border p-2 flex flex-col gap-2">
        <div class="flex flex-col sm:flex-row gap-2">
          <input v-model="connection.label" type="text" maxlength="60" placeholder="e.g. brother of" class="border p-2 sm:w-44" />
          <select v-model="connection.characterId" class="border p-2 grow">
            <option value="">No character, just text</option>
            <option v-for="other in otherCharacters" :key="other.id" :value="other.id">{{ other.name }}</option>
          </select>
        </div>
        <input v-model="connection.text" type="text" maxlength="300" placeholder="More about it (optional)" class="border p-2" />
        <button type="button" @click="removeConnection(index)" class="self-end text-sm text-red-600 cursor-pointer">Remove</button>
      </div>

      <button type="button" @click="addConnection" class="self-start border-2 border-black rounded-md px-3 py-0.5 text-sm cursor-pointer">
        + Add connection
      </button>
    </div>

    <!-- notes -->
    <label class="flex flex-col gap-1">
      <span>DM notes <span class="text-xs text-gray-500">(only you see these)</span></span>
      <textarea v-model="form.notes" rows="5" class="border p-2 bg-paperdarker"></textarea>
    </label>

    <p v-if="error" class="text-red-600">{{ error }}</p>

    <div class="flex justify-end gap-2">
      <button type="button" @click="cancel" :disabled="saving" class="border-2 border-black rounded-md px-4 py-1 cursor-pointer">
        Cancel
      </button>
      <button type="submit" :disabled="saving" class="border-2 border-black rounded-md px-4 py-1 cursor-pointer bg-black text-white disabled:opacity-50">
        {{ saving ? 'Saving...' : 'Save' }}
      </button>
    </div>
  </form>
</template>
