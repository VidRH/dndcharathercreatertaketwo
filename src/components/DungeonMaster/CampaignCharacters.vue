<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  listCampaignCharacters,
  deleteCampaignCharacter,
  SHOWABLE_FIELDS,
} from '@/components/modules/useCampaignCharacters.js'
import CharacterEditor from './CharacterEditor.vue'

// The Characters tab: every character (NPC) in the campaign
const props = defineProps({
  campaignId: { type: String, required: true },
})

const characters = ref([])
const loading = ref(true)
const error = ref(null)

onMounted(async () => {
  try {
    characters.value = await listCampaignCharacters(props.campaignId)
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
})

// null = showing the list, 'new' = making one, otherwise the id of the one being edited
const editingId = ref(null)
const editingCharacter = computed(() => characters.value.find((character) => character.id === editingId.value) ?? null)

function onSaved(saved) {
  const others = characters.value.filter((character) => character.id !== saved.id)
  characters.value = [...others, saved].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))
  editingId.value = null
}

async function onDelete(character) {
  if (!confirm(`Delete ${character.name}? This can't be undone.`)) return
  error.value = null
  try {
    characters.value = await deleteCampaignCharacter(props.campaignId, character.id, characters.value)
  } catch (err) {
    error.value = err.message
  }
}

// ---------- small helpers for the cards ----------

function nameOf(characterId) {
  return characters.value.find((character) => character.id === characterId)?.name ?? 'a removed character'
}

function shownToPlayers(character) {
  return SHOWABLE_FIELDS.filter((field) => character.visible?.[field.key]).map((field) => field.label)
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <CharacterEditor
      v-if="editingId"
      :key="editingId"
      :campaign-id="campaignId"
      :character="editingCharacter"
      :all-characters="characters"
      @saved="onSaved"
      @cancel="editingId = null"
    />

    <template v-else>
      <div class="flex justify-between items-center gap-2">
        <h2 class="text-xl uppercase">Characters</h2>
        <button @click="editingId = 'new'" class="border-2 border-black rounded-md px-4 py-1 cursor-pointer bg-black text-white">
          New Character
        </button>
      </div>

      <p v-if="loading">Loading the characters...</p>
      <p v-else-if="error" class="text-red-600">{{ error }}</p>
      <p v-else-if="characters.length === 0">No characters yet. Add the first person your players will meet!</p>

      <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div v-for="character in characters" :key="character.id" class="border-2 border-black rounded-md p-3 flex flex-col gap-1">
          <p class="text-xl font-bold break-words">{{ character.name }}</p>
          <p v-if="character.affiliation" class="break-words">{{ character.affiliation }}</p>
          <p v-if="character.alignment" class="text-sm">{{ character.alignment }}</p>
          <p class="text-sm">
            Status: {{ character.dmStatus || 'none' }}
            <span v-if="character.playerStatus !== character.dmStatus" class="text-gray-500">
              (players think: {{ character.playerStatus || 'none' }})
            </span>
          </p>

          <ul v-if="character.connections?.length" class="text-sm list-disc pl-5">
            <li v-for="(connection, index) in character.connections" :key="index" class="break-words">
              {{ connection.label }}
              <span v-if="connection.characterId" class="font-bold">{{ nameOf(connection.characterId) }}</span>
              <span v-if="connection.text" class="text-gray-600"> &ndash; {{ connection.text }}</span>
            </li>
          </ul>

          <p class="text-xs mt-1" :class="shownToPlayers(character).length ? 'text-green-700' : 'text-gray-500'">
            <template v-if="shownToPlayers(character).length">Players see: {{ shownToPlayers(character).join(', ') }}</template>
            <template v-else>Hidden from players</template>
          </p>

          <div class="flex justify-end gap-3 mt-1">
            <button @click="onDelete(character)" class="text-sm text-red-600 cursor-pointer">Delete</button>
            <button @click="editingId = character.id" class="text-sm underline cursor-pointer">Edit</button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
