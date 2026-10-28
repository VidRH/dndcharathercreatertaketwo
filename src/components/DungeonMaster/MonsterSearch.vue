<script setup>
import { ref, watch, onUnmounted } from 'vue'
import { searchMonsters, fetchMonster } from '@/components/modules/useMonsterApi.js'

// Search the D&D API for monsters by name. Clicking one fetches its
// stat block and hands it to the page with the 'add' event.
const emit = defineEmits(['add'])

const searchText = ref('')
const results = ref([])
const searching = ref(false)
const error = ref('')
const addingIndex = ref('') // which result is being fetched right now

// Wait until typing stops for a moment, instead of asking the API after every letter
let timer = null
// Counts searches, so an old slow answer can't replace a newer one
let latestSearch = 0

watch(searchText, (text) => {
  clearTimeout(timer)
  const name = text.trim()
  if (name.length < 2) {
    results.value = []
    searching.value = false
    return
  }
  searching.value = true
  timer = setTimeout(() => search(name), 300)
})
onUnmounted(() => clearTimeout(timer))

async function search(name) {
  const thisSearch = ++latestSearch
  error.value = ''
  try {
    const found = await searchMonsters(name)
    if (thisSearch === latestSearch) results.value = found
  } catch (e) {
    if (thisSearch === latestSearch) error.value = e.message
  } finally {
    if (thisSearch === latestSearch) searching.value = false
  }
}

async function add(result) {
  addingIndex.value = result.index
  error.value = ''
  try {
    emit('add', await fetchMonster(result.index))
  } catch (e) {
    error.value = e.message
  } finally {
    addingIndex.value = ''
  }
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <!-- .prevent on Enter: the search sits inside the encounter form, and Enter would save it -->
    <input v-model="searchText" @keydown.enter.prevent type="search" placeholder="Search monsters by name, e.g. goblin" class="border p-2" />

    <p v-if="searching" class="text-sm text-gray-500">Searching...</p>
    <p v-else-if="error" class="text-red-600">{{ error }}</p>
    <p v-else-if="searchText.trim().length >= 2 && results.length === 0" class="text-sm text-gray-500">No monsters found.</p>

    <!-- max-h + overflow: a long list scrolls inside the box instead of pushing the page down -->
    <ul v-if="results.length" class="border max-h-64 overflow-y-auto">
      <li v-for="result in results" :key="result.index" class="flex justify-between items-center gap-2 px-2 py-1 border-b last:border-b-0">
        <span>{{ result.name }}</span>
        <button
          type="button"
          @click="add(result)"
          :disabled="addingIndex !== ''"
          class="border-2 border-black rounded-md px-3 py-0.5 text-sm cursor-pointer disabled:opacity-50"
        >
          {{ addingIndex === result.index ? 'Adding...' : 'Add' }}
        </button>
      </li>
    </ul>
  </div>
</template>
