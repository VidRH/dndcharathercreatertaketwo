<script setup>
import { ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { getCampaign } from '@/components/modules/useCampaigns.js'
import CampaignOverview from '@/components/DungeonMaster/CampaignOverview.vue'
import CampaignCharacters from '@/components/DungeonMaster/CampaignCharacters.vue'
import CampaignEncounters from '@/components/DungeonMaster/CampaignEncounters.vue'

// The DM's page for one campaign: /DungeonMaster/:campaignId
const route = useRoute()

const campaign = ref(null)
const loading = ref(true)
const error = ref(null)

// Players and Invite get added here in the next phases
const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'characters', label: 'Characters' },
  { id: 'encounters', label: 'Encounters' },
]
const activeTab = ref('overview')

// A tab is only made the first time you open it, and after that it's just hidden when you
// switch away (v-show). That way half-typed work in one tab is still there when you come back.
const openedTabs = ref(new Set(['overview']))
function openTab(tabId) {
  activeTab.value = tabId
  openedTabs.value.add(tabId)
}

async function load(campaignId) {
  loading.value = true
  error.value = null
  campaign.value = null
  // ?tab=encounters in the link opens that tab, e.g. coming back from an encounter
  const startTab = tabs.some((tab) => tab.id === route.query.tab) ? route.query.tab : 'overview'
  activeTab.value = startTab
  openedTabs.value = new Set(['overview', startTab])
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
          @click="openTab(tab.id)"
          :class="[
            'px-4 py-1 rounded-t-md border-2 border-b-0 border-black cursor-pointer whitespace-nowrap',
            activeTab === tab.id ? 'bg-black text-white' : '',
          ]"
        >
          {{ tab.label }}
        </button>
      </nav>

      <CampaignOverview v-show="activeTab === 'overview'" :campaign="campaign" @saved="onSaved" />
      <CampaignCharacters v-if="openedTabs.has('characters')" v-show="activeTab === 'characters'" :campaign-id="campaign.id" />
      <CampaignEncounters v-if="openedTabs.has('encounters')" v-show="activeTab === 'encounters'" :campaign-id="campaign.id" />
    </template>
  </main>
</template>
