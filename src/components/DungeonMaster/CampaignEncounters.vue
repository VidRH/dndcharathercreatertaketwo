<script setup>
import { ref, onMounted } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { listEncounters, createEncounter, shownToPlayers } from '@/components/modules/useEncounters.js'
import { calculateEncounter } from '@/components/modules/useEncounterMath.js'

// The Encounters tab: every encounter in the campaign. Each one opens on its own page.
const props = defineProps({
  campaignId: { type: String, required: true },
})

const router = useRouter()

const encounters = ref([])
const loading = ref(true)
const error = ref(null)

onMounted(async () => {
  try {
    encounters.value = await listEncounters(props.campaignId)
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
})

// ---------- the "new encounter" form ----------

const showNewForm = ref(false)
const newName = ref('')
const creating = ref(false)
const createError = ref('')

function openNewForm() {
  newName.value = ''
  createError.value = ''
  showNewForm.value = true
}

async function onCreate() {
  const name = newName.value.trim()
  if (!name) {
    createError.value = 'Give the encounter a name.'
    return
  }

  creating.value = true
  createError.value = ''
  try {
    const id = await createEncounter(props.campaignId, name)
    // Straight to the new encounter, to add monsters and a map
    router.push(`/DungeonMaster/${props.campaignId}/encounter/${id}`)
  } catch (err) {
    createError.value = err.message
    creating.value = false
  }
}

// ---------- small helpers for the cards ----------

// e.g. '4 x Goblin, 1 x Bugbear'
function monsterSummary(encounter) {
  return encounter.monsters.map((monster) => `${monster.quantity} × ${monster.statBlock.name}`).join(', ')
}

function difficultyOf(encounter) {
  return calculateEncounter(encounter.monsters, encounter.partySize, encounter.partyLevel)
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex justify-between items-center gap-2">
      <h2 class="text-xl uppercase">Encounters</h2>
      <button v-if="!showNewForm" @click="openNewForm" class="border-2 border-black rounded-md px-4 py-1 cursor-pointer bg-black text-white">
        New Encounter
      </button>
    </div>

    <form v-if="showNewForm" @submit.prevent="onCreate" class="border-2 border-black rounded-md p-4 flex flex-col gap-2">
      <input v-model="newName" type="text" placeholder="Encounter name, e.g. Ambush at the bridge" required maxlength="80" class="border p-2" />
      <p v-if="createError" class="text-red-600">{{ createError }}</p>
      <div class="flex justify-end gap-2">
        <button type="button" @click="showNewForm = false" :disabled="creating" class="border-2 border-black rounded-md px-4 py-1 cursor-pointer">
          Cancel
        </button>
        <button type="submit" :disabled="creating" class="border-2 border-black rounded-md px-4 py-1 cursor-pointer bg-black text-white disabled:opacity-50">
          {{ creating ? 'Creating...' : 'Create' }}
        </button>
      </div>
    </form>

    <p v-if="loading">Loading the encounters...</p>
    <p v-else-if="error" class="text-red-600">{{ error }}</p>
    <p v-else-if="encounters.length === 0">No encounters yet. Plan the first fight!</p>

    <!-- one card per encounter, click it to open it -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <RouterLink
        v-for="encounter in encounters"
        :key="encounter.id"
        :to="`/DungeonMaster/${campaignId}/encounter/${encounter.id}`"
        class="border-2 border-black rounded-md p-3 flex flex-col gap-1 hover:text-blue"
      >
        <p class="text-xl font-bold break-words">{{ encounter.name }}</p>
        <p v-if="encounter.monsters.length" class="text-sm break-words">{{ monsterSummary(encounter) }}</p>
        <p v-else class="text-sm text-gray-500">No monsters yet</p>
        <p v-if="encounter.monsters.length" class="text-sm">
          {{ difficultyOf(encounter).totalXp.toLocaleString() }} XP, {{ difficultyOf(encounter).difficulty }}
          for {{ encounter.partySize }} level {{ encounter.partyLevel }} players
        </p>
        <p v-if="encounter.mapUrl" class="text-sm">Has a map</p>
        <p class="text-xs mt-1" :class="shownToPlayers(encounter).length ? 'text-green-700' : 'text-gray-500'">
          <template v-if="shownToPlayers(encounter).length">Players see: {{ shownToPlayers(encounter).join(', ') }}</template>
          <template v-else>Hidden from players</template>
        </p>
      </RouterLink>
    </div>
  </div>
</template>
