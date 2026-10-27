<script setup>
import { ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { getCampaign } from '@/components/modules/useCampaigns.js'
import CampaignOverview from '@/components/DungeonMaster/CampaignOverview.vue'

// The DM's page for one campaign: /DungeonMaster/:campaignId
const route = useRoute()

const campaign = ref(null)
const loading = ref(true)
const error = ref(null)

// One tab for now: Characters, Encounters, Players and Invite get added here in the next phases
const tabs = [{ id: 'overview', label: 'Overview' }]
const activeTab = ref('overview')

async function load(campaignId) {
  loading.value = true
  error.value = null
  campaign.value = null
  try {
    campaign.value = await getCampaign(campaignId)
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

// immediate = also run once right away. Watching the id means the page also
// reloads if you go from one campaign straight to another.
watch(() => route.params.campaignId, load, { immediate: true })

function onSaved(fields) {
  campaign.value = { ...campaign.value, ...fields }
}
</script>

<template>
  <main class="flex flex-col gap-4 max-w-3xl mx-auto p-4">
    <RouterLink to="/DungeonMaster" class="self-start hover:text-blue">&larr; My campaigns</RouterLink>

    <p v-if="loading">Loading the campaign...</p>
    <p v-else-if="error" class="text-red-600">{{ error }}</p>

    <template v-else>
      <h1 class="text-2xl uppercase break-words">{{ campaign.name }}</h1>

      <!-- tab buttons, they scroll sideways on a phone when there are many -->
      <nav class="flex gap-2 overflow-x-auto border-b-2 border-black">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="activeTab = tab.id"
          :class="[
            'px-4 py-1 rounded-t-md border-2 border-b-0 border-black cursor-pointer whitespace-nowrap',
            activeTab === tab.id ? 'bg-black text-white' : '',
          ]"
        >
          {{ tab.label }}
        </button>
      </nav>

      <CampaignOverview v-if="activeTab === 'overview'" :campaign="campaign" @saved="onSaved" />
    </template>
  </main>
</template>
