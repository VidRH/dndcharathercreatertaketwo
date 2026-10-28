<script setup>
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { listAllCampaigns } from '@/components/modules/useAdmin.js'
import { deleteCampaignEverywhere } from '@/components/modules/useCloudFunctions.js'

// The Campaigns tab of the admin page: every campaign of every DM
const campaigns = ref([])
const loading = ref(true)
const error = ref('')
const search = ref('')

onMounted(async () => {
  try {
    campaigns.value = await listAllCampaigns()
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
})

// Search by campaign name or DM name
const shownCampaigns = computed(() => {
  const text = search.value.trim().toLowerCase()
  if (!text) return campaigns.value
  return campaigns.value.filter(
    (campaign) => campaign.name.toLowerCase().includes(text) || campaign.dmName.toLowerCase().includes(text),
  )
})

const deletingId = ref(null)

async function onDelete(campaign) {
  if (!confirm(`Delete ${campaign.name} (run by ${campaign.dmName}) with everything in it? This can't be undone.`)) return
  deletingId.value = campaign.id
  error.value = ''
  try {
    await deleteCampaignEverywhere(campaign.id)
    campaigns.value = campaigns.value.filter((other) => other.id !== campaign.id)
  } catch (e) {
    error.value = e.message
  } finally {
    deletingId.value = null
  }
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <input v-model="search" type="search" placeholder="Search by campaign or DM name" class="border p-2" />

    <p v-if="loading">Loading the campaigns...</p>
    <p v-if="error" class="text-red-600">{{ error }}</p>
    <p v-if="!loading && shownCampaigns.length === 0">No campaigns found.</p>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div v-for="campaign in shownCampaigns" :key="campaign.id" class="border-2 border-black rounded-md p-3 flex flex-col gap-1">
        <p class="text-xl font-bold break-words">{{ campaign.name }}</p>
        <p v-if="campaign.shortDescription" class="text-sm break-words">{{ campaign.shortDescription }}</p>
        <p class="text-sm">DM: {{ campaign.dmName }}</p>
        <p class="text-sm">{{ campaign.memberCount }} player{{ campaign.memberCount === 1 ? '' : 's' }}</p>
        <p v-if="campaign.updatedAt" class="text-xs text-gray-500">last edited {{ campaign.updatedAt.toLocaleString() }}</p>

        <div class="flex flex-wrap justify-end gap-3 mt-1">
          <button @click="onDelete(campaign)" :disabled="deletingId !== null" class="text-sm text-red-600 cursor-pointer disabled:opacity-50">
            {{ deletingId === campaign.id ? 'Deleting...' : 'Delete' }}
          </button>
          <RouterLink :to="`/Campaigns/${campaign.id}`" class="text-sm underline hover:text-blue">Player view</RouterLink>
          <!-- admins can open and edit any campaign on the DM's own pages -->
          <RouterLink :to="`/DungeonMaster/${campaign.id}`" class="text-sm underline hover:text-blue">Open and edit</RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>
