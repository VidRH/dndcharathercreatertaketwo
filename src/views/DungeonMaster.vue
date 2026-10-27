<script setup>
import { ref, onMounted } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { listMyCampaigns, createCampaign } from '@/components/modules/useCampaigns.js'

const router = useRouter()

const campaigns = ref([])
const loading = ref(true)
const error = ref(null)

onMounted(async () => {
  try {
    campaigns.value = await listMyCampaigns()
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
})

// ---------- the "new campaign" form ----------

const showNewForm = ref(false)
const newName = ref('')
const newShortDescription = ref('')
const creating = ref(false)
const createError = ref('')

function openNewForm() {
  newName.value = ''
  newShortDescription.value = ''
  createError.value = ''
  showNewForm.value = true
}

async function onCreate() {
  const name = newName.value.trim()
  if (!name) {
    createError.value = 'Give your campaign a name.'
    return
  }

  creating.value = true
  createError.value = ''
  try {
    const id = await createCampaign({ name, shortDescription: newShortDescription.value.trim() })
    // Straight to the new campaign, so the DM can fill in the rest
    router.push(`/DungeonMaster/${id}`)
  } catch (err) {
    createError.value = err.message
    creating.value = false
  }
}
</script>

<template>
  <main class="flex flex-col gap-4 max-w-3xl mx-auto p-4">
    <div class="flex justify-between items-center gap-2">
      <h1 class="text-2xl uppercase">My Campaigns</h1>
      <button v-if="!showNewForm" @click="openNewForm" class="border-2 border-black rounded-md px-4 py-1 text-lg cursor-pointer bg-black text-white">
        New Campaign
      </button>
    </div>

    <form v-if="showNewForm" @submit.prevent="onCreate" class="border-2 border-black rounded-md p-4 flex flex-col gap-2">
      <h2 class="text-xl uppercase">New campaign</h2>
      <input v-model="newName" type="text" placeholder="Campaign name" required maxlength="80" class="border p-2" />
      <textarea v-model="newShortDescription" rows="2" maxlength="200" placeholder="Short description (optional)" class="border p-2"></textarea>
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

    <p v-if="loading">Loading your campaigns...</p>
    <p v-else-if="error" class="text-red-600">{{ error }}</p>
    <p v-else-if="campaigns.length === 0">No campaigns yet. Start your first one!</p>

    <!-- one card per campaign, click it to open it -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <RouterLink
        v-for="campaign in campaigns"
        :key="campaign.id"
        :to="`/DungeonMaster/${campaign.id}`"
        class="border-2 border-black rounded-md p-3 flex flex-col gap-1 hover:text-blue"
      >
        <p class="text-xl font-bold break-words">{{ campaign.name }}</p>
        <p v-if="campaign.shortDescription" class="break-words">{{ campaign.shortDescription }}</p>
        <p v-if="campaign.updatedAt" class="text-xs text-gray-500">
          last edited {{ campaign.updatedAt.toLocaleString() }}
        </p>
      </RouterLink>
    </div>
  </main>
</template>
