<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { RouterLink, useRoute, useRouter, onBeforeRouteLeave } from 'vue-router'
import {
  getEncounter,
  saveEncounter,
  deleteEncounter,
  newMonsterEntry,
  uploadEncounterMap,
  deleteMapFile,
  mapProblem,
} from '@/components/modules/useEncounters.js'
import { challengeText } from '@/components/modules/useMonsterApi.js'
import VisibilityToggle from '@/components/DungeonMaster/VisibilityToggle.vue'
import MonsterSearch from '@/components/DungeonMaster/MonsterSearch.vue'
import MonsterStatBlock from '@/components/DungeonMaster/MonsterStatBlock.vue'
import EncounterCalculator from '@/components/DungeonMaster/EncounterCalculator.vue'

// The DM's page for one encounter: /DungeonMaster/:campaignId/encounter/:encounterId
const route = useRoute()
const router = useRouter()
const campaignId = route.params.campaignId
const encounterId = route.params.encounterId
const backToCampaign = `/DungeonMaster/${campaignId}?tab=encounters`

const form = ref(null) // the encounter being edited, null while loading
const savedJson = ref('') // what's in Firestore, to tell if anything changed
const loading = ref(true)
const loadError = ref('')

onMounted(async () => {
  try {
    form.value = await getEncounter(campaignId, encounterId)
    savedJson.value = JSON.stringify(form.value)
  } catch (e) {
    loadError.value = e.message
  } finally {
    loading.value = false
  }
})

// ---------- the map ----------

const newMap = ref(null) // picked, not uploaded until Save
const newMapPreview = ref('')
const removeMap = ref(false)
const mapError = ref('')
const mapOpen = ref(false) // the big full-screen view

const mapToShow = computed(() => {
  if (newMapPreview.value) return newMapPreview.value
  if (removeMap.value) return ''
  return form.value?.mapUrl ?? ''
})

function onMapChosen(event) {
  const file = event.target.files[0]
  event.target.value = '' // so picking the same file again still counts
  if (!file) return

  const problem = mapProblem(file)
  if (problem) {
    mapError.value = problem
    return
  }
  clearNewMap()
  mapError.value = ''
  newMap.value = file
  newMapPreview.value = URL.createObjectURL(file)
  removeMap.value = false
}

function onRemoveMap() {
  clearNewMap()
  removeMap.value = true
}

function clearNewMap() {
  if (newMapPreview.value) URL.revokeObjectURL(newMapPreview.value)
  newMapPreview.value = ''
  newMap.value = null
}

// Escape closes the full-screen map
function onKeydown(event) {
  if (event.key === 'Escape') mapOpen.value = false
}
onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  clearNewMap()
})

// ---------- monsters ----------

function addMonster(statBlock) {
  form.value.monsters.push(newMonsterEntry(statBlock))
}

function changeQuantity(monster, change) {
  monster.quantity = Math.max(1, monster.quantity + change)
}

function removeMonster(index) {
  const monster = form.value.monsters[index]
  if (!confirm(`Remove ${monster.statBlock.name} from this encounter?`)) return
  form.value.monsters.splice(index, 1)
}

// Show or hide every part at once
function setAllVisible(visible) {
  form.value.visible = { name: visible, description: visible, map: visible }
  for (const monster of form.value.monsters) {
    monster.visible = { name: visible, statBlock: visible }
  }
}

// ---------- saving ----------

const hasChanges = computed(
  () => form.value !== null && (JSON.stringify(form.value) !== savedJson.value || newMap.value !== null || removeMap.value),
)
const saving = ref(false)
const saveError = ref('')
const justSaved = ref(false)

async function save() {
  const name = form.value.name.trim()
  if (!name) {
    saveError.value = "The encounter name can't be empty."
    return
  }

  saving.value = true
  saveError.value = ''
  try {
    const encounter = {
      ...form.value,
      name,
      // an emptied number box would save as ''
      partySize: Math.min(Math.max(Number(form.value.partySize) || 1, 1), 10),
      partyLevel: Math.min(Math.max(Number(form.value.partyLevel) || 1, 1), 20),
    }

    const oldMapPath = form.value.mapPath
    const mapChanged = newMap.value !== null || removeMap.value
    if (newMap.value) Object.assign(encounter, await uploadEncounterMap(campaignId, encounterId, newMap.value))
    else if (removeMap.value) Object.assign(encounter, { mapUrl: '', mapPath: '' })

    await saveEncounter(campaignId, encounterId, encounter)
    // The old map is only deleted once the encounter points at the new one
    if (mapChanged && oldMapPath) await deleteMapFile(oldMapPath)

    form.value = encounter
    savedJson.value = JSON.stringify(encounter)
    clearNewMap()
    removeMap.value = false
    justSaved.value = true
  } catch (e) {
    saveError.value = e.message
  } finally {
    saving.value = false
  }
}

// Changing anything hides the old "Saved" message
function onInput() {
  justSaved.value = false
}

// ---------- don't lose unsaved work ----------

let leaving = false

onBeforeRouteLeave(() => {
  if (leaving || !hasChanges.value) return true
  return confirm('You have unsaved changes in this encounter. Leave anyway?')
})

function warnBeforeClosing(event) {
  if (hasChanges.value) event.preventDefault()
}
onMounted(() => window.addEventListener('beforeunload', warnBeforeClosing))
onUnmounted(() => window.removeEventListener('beforeunload', warnBeforeClosing))

// ---------- deleting ----------

const deleteError = ref('')

async function onDelete() {
  if (!confirm(`Delete ${form.value.name}? This can't be undone.`)) return
  deleteError.value = ''
  try {
    await deleteEncounter(campaignId, encounterId, form.value.mapPath)
    leaving = true
    router.push(backToCampaign)
  } catch (e) {
    deleteError.value = e.message
  }
}
</script>

<template>
  <main class="flex flex-col gap-4 max-w-3xl mx-auto p-4">
    <RouterLink :to="backToCampaign" class="self-start hover:text-blue">&larr; Back to the campaign</RouterLink>

    <p v-if="loading">Loading the encounter...</p>
    <p v-else-if="loadError" class="text-red-600">{{ loadError }}</p>

    <template v-else>
      <div class="flex flex-wrap justify-between items-center gap-2">
        <h1 class="text-2xl uppercase break-words">{{ form.name || 'Unnamed encounter' }}</h1>
        <div class="flex gap-3 text-sm">
          <button type="button" @click="setAllVisible(true)" class="underline cursor-pointer">Show everything</button>
          <button type="button" @click="setAllVisible(false)" class="underline cursor-pointer">Hide everything</button>
        </div>
      </div>
      <p class="text-xs text-gray-500 -mt-3">
        Everything starts hidden. Players only ever see the parts you switch to "shown". Notes are never shown.
      </p>

      <!-- @input and @click catch every change, to hide the old "Saved" message -->
      <form @submit.prevent="save" @input="onInput" @click="onInput" class="flex flex-col gap-4">
        <!-- ---------- name and description ---------- -->
        <section class="border-2 border-black rounded-md p-4 flex flex-col gap-3">
          <div class="flex flex-col gap-1">
            <div class="flex justify-between items-center gap-2">
              <label for="encounter-name">Name</label>
              <VisibilityToggle v-model="form.visible.name" />
            </div>
            <input id="encounter-name" v-model="form.name" type="text" required maxlength="80" class="border p-2" />
          </div>

          <div class="flex flex-col gap-1">
            <div class="flex justify-between items-center gap-2">
              <label for="encounter-description">Description</label>
              <VisibilityToggle v-model="form.visible.description" />
            </div>
            <textarea id="encounter-description" v-model="form.description" rows="4" placeholder="What the players walk into" class="border p-2"></textarea>
          </div>
        </section>

        <!-- ---------- map ---------- -->
        <section class="border-2 border-black rounded-md p-4 flex flex-col gap-3">
          <div class="flex justify-between items-center gap-2">
            <h2 class="text-xl uppercase">Map</h2>
            <VisibilityToggle v-model="form.visible.map" />
          </div>

          <button v-if="mapToShow" type="button" @click="mapOpen = true" class="cursor-zoom-in" title="Click to see it big">
            <img :src="mapToShow" alt="Encounter map" class="w-full max-h-96 object-contain border bg-paperdarker" />
          </button>
          <p v-else class="text-sm text-gray-500">No map yet.</p>

          <div class="flex flex-wrap items-center gap-3">
            <!-- a label around a hidden file input, so the button can look like the others -->
            <label class="border-2 border-black rounded-md px-4 py-1 cursor-pointer">
              {{ mapToShow ? 'Replace map' : 'Choose map' }}
              <input type="file" accept="image/*" @change="onMapChosen" class="hidden" />
            </label>
            <button v-if="mapToShow" type="button" @click="onRemoveMap" class="text-sm text-red-600 cursor-pointer">Remove map</button>
            <span class="text-xs text-gray-500">An image, smaller than 10 MB. Uploaded when you save.</span>
          </div>
          <p v-if="mapError" class="text-red-600">{{ mapError }}</p>
        </section>

        <!-- ---------- calculations ---------- -->
        <EncounterCalculator v-model:party-size="form.partySize" v-model:party-level="form.partyLevel" :monsters="form.monsters" />

        <!-- ---------- monsters ---------- -->
        <section class="border-2 border-black rounded-md p-4 flex flex-col gap-3">
          <h2 class="text-xl uppercase">Monsters</h2>
          <MonsterSearch @add="addMonster" />

          <p v-if="form.monsters.length === 0" class="text-sm text-gray-500">No monsters yet. Search for one above.</p>

          <div v-for="(monster, index) in form.monsters" :key="monster.key" class="border-2 border-black rounded-md p-3 flex flex-col gap-2">
            <div class="flex flex-wrap justify-between items-center gap-2">
              <div>
                <p class="text-lg font-bold">{{ monster.statBlock.name }}</p>
                <p class="text-xs text-gray-500">
                  CR {{ challengeText(monster.statBlock.challengeRating) }}, {{ monster.statBlock.xp.toLocaleString() }} XP each
                </p>
              </div>
              <div class="flex items-center gap-2">
                <button type="button" @click="changeQuantity(monster, -1)" :disabled="monster.quantity <= 1" class="border-2 border-black rounded-md w-8 cursor-pointer disabled:opacity-50" aria-label="One less">&minus;</button>
                <span class="w-8 text-center">{{ monster.quantity }}</span>
                <button type="button" @click="changeQuantity(monster, 1)" class="border-2 border-black rounded-md w-8 cursor-pointer" aria-label="One more">+</button>
              </div>
            </div>

            <div class="flex flex-wrap gap-2">
              <VisibilityToggle v-model="monster.visible.name" label="Name and number" />
              <VisibilityToggle v-model="monster.visible.statBlock" label="Stat block" />
            </div>

            <textarea v-model="monster.notes" rows="2" placeholder="Notes about this monster (only you see these)" class="border p-2 bg-paperdarker text-sm"></textarea>

            <!-- details = folds open and shut by itself -->
            <details>
              <summary class="cursor-pointer select-none">Stat block</summary>
              <MonsterStatBlock :stat-block="monster.statBlock" class="mt-2" />
            </details>

            <button type="button" @click="removeMonster(index)" class="self-end text-sm text-red-600 cursor-pointer">Remove</button>
          </div>
        </section>

        <!-- ---------- notes ---------- -->
        <label class="border-2 border-black rounded-md p-4 flex flex-col gap-1">
          <span class="text-xl uppercase">Encounter notes</span>
          <span class="text-sm text-gray-500">Tactics, loot, what happens next... Only you see these.</span>
          <textarea v-model="form.notes" rows="6" class="border p-2 bg-paperdarker"></textarea>
        </label>

        <!-- sticky = stays at the bottom of the screen while you scroll this long page -->
        <div class="sticky bottom-0 bg-paperlighter border-t-2 border-black py-2 flex flex-wrap justify-end items-center gap-3">
          <p v-if="saveError" class="text-red-600 grow">{{ saveError }}</p>
          <span v-if="hasChanges" class="text-sm text-gray-500">Unsaved changes</span>
          <span v-else-if="justSaved" class="text-sm text-green-700">Saved</span>
          <button type="submit" :disabled="saving || !hasChanges" class="border-2 border-black rounded-md px-4 py-1 cursor-pointer bg-black text-white disabled:opacity-50 disabled:cursor-default">
            {{ saving ? 'Saving...' : 'Save' }}
          </button>
        </div>
      </form>

      <!-- kept apart and at the bottom, so nobody presses it by accident -->
      <section class="border-2 border-red-600 rounded-md p-4 flex flex-col gap-2">
        <h2 class="text-xl uppercase text-red-600">Delete encounter</h2>
        <p class="text-sm">This removes the encounter, its monsters and its map for good.</p>
        <p v-if="deleteError" class="text-red-600">{{ deleteError }}</p>
        <button @click="onDelete" class="self-end border-2 border-red-600 text-red-600 rounded-md px-4 py-1 cursor-pointer">
          Delete encounter
        </button>
      </section>

      <!-- the map, full screen. Click anywhere or press Escape to close. -->
      <div v-if="mapOpen && mapToShow" @click="mapOpen = false" class="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 cursor-zoom-out">
        <img :src="mapToShow" alt="Encounter map" class="max-w-full max-h-full object-contain" />
      </div>
    </template>
  </main>
</template>
