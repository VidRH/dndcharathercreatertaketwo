<script setup>
import { ref, onMounted } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { getPublicEncounter } from '@/components/modules/usePlayerView.js'
import MonsterStatBlock from '@/components/DungeonMaster/MonsterStatBlock.vue'
import MapViewer from '@/components/DungeonMaster/MapViewer.vue'

// A player's look at one encounter: /Campaigns/:campaignId/encounter/:encounterId
// Only the parts the DM switched to "shown".
const route = useRoute()
const backToCampaign = `/Campaigns/${route.params.campaignId}?tab=encounters`

const encounter = ref(null)
const loading = ref(true)
const error = ref('')

onMounted(async () => {
  try {
    encounter.value = await getPublicEncounter(route.params.campaignId, route.params.encounterId)
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <main class="flex flex-col gap-4 max-w-3xl mx-auto p-4">
    <RouterLink :to="backToCampaign" class="self-start hover:text-blue">&larr; Back to the campaign</RouterLink>

    <p v-if="loading">Loading the encounter...</p>
    <p v-else-if="error" class="text-red-600">{{ error }}</p>

    <template v-else>
      <h1 class="text-2xl uppercase break-words">{{ encounter.name || 'Unnamed encounter' }}</h1>

      <p v-if="encounter.description" class="whitespace-pre-line break-words">{{ encounter.description }}</p>

      <MapViewer v-if="encounter.mapUrl" :url="encounter.mapUrl" />

      <section v-if="encounter.monsters?.length" class="flex flex-col gap-3">
        <h2 class="text-xl uppercase">Creatures</h2>
        <div v-for="monster in encounter.monsters" :key="monster.key" class="border-2 border-black rounded-md p-3 flex flex-col gap-2">
          <p class="text-lg font-bold">
            <template v-if="monster.name">{{ monster.quantity }} &times; {{ monster.name }}</template>
            <template v-else>Unknown creature</template>
          </p>
          <details v-if="monster.statBlock">
            <summary class="cursor-pointer select-none">Stat block</summary>
            <MonsterStatBlock :stat-block="monster.statBlock" class="mt-2" />
          </details>
        </div>
      </section>
    </template>
  </main>
</template>
