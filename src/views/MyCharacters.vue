<script setup>
import { ref, onMounted } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { listCharacters, deleteCharacter } from '../components/modules/useSavedCharacters.js'

const router = useRouter()

const characters = ref([])
const loading = ref(true)
const error = ref(null)

// The page starts the fetch when it mounts
onMounted(async () => {
  try {
    characters.value = await listCharacters()
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
})

// No id in the URL = the maker wipes the sheet for a new character
function newCharacter() {
  router.push('/CharatherMaker')
}

async function onDelete(character) {
  if (!confirm(`Delete ${character.name || 'this unnamed character'}? This can't be undone.`)) return
  try {
    await deleteCharacter(character.id)
    characters.value = characters.value.filter((other) => other.id !== character.id)
  } catch (err) {
    error.value = err.message
  }
}
</script>

<template>
  <main class="flex flex-col gap-4 max-w-3xl mx-auto p-4">
    <div class="flex justify-between items-center">
      <h1 class="text-2xl uppercase">My Characters</h1>
      <button @click="newCharacter" class="border-2 border-black rounded-md px-4 py-1 text-lg cursor-pointer bg-black text-white">
        New Character
      </button>
    </div>

    <p v-if="loading">Loading your characters...</p>
    <p v-else-if="error" class="text-red-600">{{ error }}</p>
    <p v-else-if="characters.length === 0">No characters yet. Make your first one!</p>

    <!-- one card per character, click it to open it in the maker -->
    <div v-else class="grid grid-cols-2 gap-4">
      <div v-for="character in characters" :key="character.id" class="border-2 border-black rounded-md p-3 flex flex-col gap-1">
        <RouterLink :to="`/CharatherMaker/${character.id}`" class="flex flex-col gap-1 hover:text-blue">
          <p class="text-xl font-bold">{{ character.name || 'Unnamed character' }}</p>
          <p>
            Level {{ character.level }}
            {{ character.raceName }}
            {{ character.className || 'No class yet' }}
          </p>
          <p v-if="character.updatedAt" class="text-xs text-gray-500">
            last saved {{ character.updatedAt.toLocaleString() }}
          </p>
        </RouterLink>
        <button @click="onDelete(character)" class="self-end text-sm text-red-600 cursor-pointer">Delete</button>
      </div>
    </div>
  </main>
</template>
