<script setup>
import { ref, computed, onMounted } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { auth } from '@/firebase'
import { getCampaignForPlayer, listPublicCharacters, listPublicEncounters } from '@/components/modules/usePlayerView.js'
import { listMembers } from '@/components/modules/useCampaignMembers.js'
import ProfilePicture from '@/components/Account/ProfilePicture.vue'

// A player's look at a campaign they joined: /Campaigns/:campaignId
// Only what the DM chose to show. (The DM can open it too, to check what players see.)
const route = useRoute()
const campaignId = route.params.campaignId
const myUid = auth.currentUser.uid

const campaign = ref(null)
const members = ref([])
const characters = ref([])
const encounters = ref([])
const loading = ref(true)
const error = ref('')

onMounted(async () => {
  try {
    // The campaign first: if you can't see it, the rest would only give more errors
    campaign.value = await getCampaignForPlayer(campaignId)
    const [memberList, characterList, encounterList] = await Promise.all([
      listMembers(campaignId),
      listPublicCharacters(campaignId),
      listPublicEncounters(campaignId),
    ])
    members.value = memberList
    characters.value = characterList
    encounters.value = encounterList
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
})

const isDM = computed(() => campaign.value?.dmId === myUid)

// ---------- tabs ----------

const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'characters', label: 'Characters' },
  { id: 'encounters', label: 'Encounters' },
]
// ?tab=encounters in the link opens that tab, e.g. coming back from an encounter
const activeTab = ref(tabs.some((tab) => tab.id === route.query.tab) ? route.query.tab : 'overview')

// ---------- small helpers ----------

// A connection only names someone whose name players are allowed to see
function connectedName(characterId) {
  return characters.value.find((character) => character.id === characterId)?.name ?? ''
}

// e.g. '3 × Goblin, 1 × Bugbear and 2 unknown creatures'
function monsterSummary(encounter) {
  const monsters = encounter.monsters ?? []
  const named = monsters.filter((monster) => monster.name).map((monster) => `${monster.quantity} × ${monster.name}`)
  const unknown = monsters.length - named.length
  if (unknown > 0) named.push(`${unknown} unknown creature${unknown === 1 ? '' : 's'}`)
  return named.join(', ')
}
</script>

<template>
  <main class="flex flex-col gap-4 max-w-3xl mx-auto p-4">
    <RouterLink v-if="isDM" :to="`/DungeonMaster/${campaignId}`" class="self-start hover:text-blue">&larr; Back to running the campaign</RouterLink>
    <RouterLink v-else to="/Campaigns" class="self-start hover:text-blue">&larr; My campaigns</RouterLink>

    <p v-if="loading">Loading the campaign...</p>
    <p v-else-if="error" class="text-red-600">{{ error }}</p>

    <template v-else>
      <p v-if="isDM" class="border-2 border-black rounded-md bg-paperdarker p-2 text-sm">
        You're the DM. This is exactly what your players see.
      </p>

      <div>
        <h1 class="text-2xl uppercase break-words">{{ campaign.name }}</h1>
        <p v-if="campaign.shortDescription" class="break-words">{{ campaign.shortDescription }}</p>
      </div>

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

      <!-- ---------- overview: the story and the party ---------- -->
      <div v-show="activeTab === 'overview'" class="flex flex-col gap-4">
        <section class="border-2 border-black rounded-md p-4 flex flex-col gap-2">
          <h2 class="text-xl uppercase">About</h2>
          <p v-if="campaign.longDescription" class="whitespace-pre-line break-words">{{ campaign.longDescription }}</p>
          <p v-else class="text-gray-500">The DM hasn't written anything here yet.</p>
        </section>

        <section class="border-2 border-black rounded-md p-4 flex flex-col gap-3">
          <h2 class="text-xl uppercase">The party</h2>

          <div class="flex items-center gap-3">
            <ProfilePicture :url="campaign.dm.photoURL" :name="campaign.dm.displayName" size="w-10 h-10 text-lg" />
            <p><span class="font-bold">{{ campaign.dm.displayName }}</span> <span class="text-sm text-gray-500">(Dungeon Master)</span></p>
          </div>

          <p v-if="members.length === 0" class="text-gray-500">Nobody has joined yet.</p>
          <div v-for="member in members" :key="member.uid" class="flex items-center gap-3">
            <ProfilePicture :url="member.profile.photoURL" :name="member.profile.displayName" size="w-10 h-10 text-lg" />
            <p class="break-words min-w-0">
              <span class="font-bold">{{ member.profile.displayName }}</span>
              <span v-if="member.uid === myUid" class="text-sm text-gray-500"> (you)</span>
              plays {{ member.character.name }}, level {{ member.character.level }}
              {{ member.character.raceName }} {{ member.character.className }}
            </p>
          </div>
        </section>
      </div>

      <!-- ---------- characters the DM shared ---------- -->
      <div v-show="activeTab === 'characters'" class="flex flex-col gap-4">
        <p v-if="characters.length === 0">You haven't met anyone yet.</p>
        <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div v-for="character in characters" :key="character.id" class="border-2 border-black rounded-md p-3 flex flex-col gap-1">
            <p class="text-xl font-bold break-words">{{ character.name || 'Unknown name' }}</p>
            <p v-if="character.affiliation" class="break-words">{{ character.affiliation }}</p>
            <p v-if="character.alignment" class="text-sm">{{ character.alignment }}</p>
            <p v-if="character.playerStatus" class="text-sm">Status: {{ character.playerStatus }}</p>
            <ul v-if="character.connections?.length" class="text-sm list-disc pl-5">
              <li v-for="(connection, index) in character.connections" :key="index" class="break-words">
                {{ connection.label }}
                <span v-if="connectedName(connection.characterId)" class="font-bold">{{ connectedName(connection.characterId) }}</span>
                <span v-if="connection.text" class="text-gray-600"> &ndash; {{ connection.text }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- ---------- encounters the DM shared ---------- -->
      <div v-show="activeTab === 'encounters'" class="flex flex-col gap-4">
        <p v-if="encounters.length === 0">Nothing to see here yet.</p>
        <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <RouterLink
            v-for="encounter in encounters"
            :key="encounter.id"
            :to="`/Campaigns/${campaignId}/encounter/${encounter.id}`"
            class="border-2 border-black rounded-md p-3 flex flex-col gap-1 hover:text-blue"
          >
            <p class="text-xl font-bold break-words">{{ encounter.name || 'Unnamed encounter' }}</p>
            <!-- line-clamp: only the first 3 lines, the rest is on the encounter's page -->
            <p v-if="encounter.description" class="text-sm line-clamp-3 whitespace-pre-line break-words">{{ encounter.description }}</p>
            <p v-if="encounter.monsters?.length" class="text-sm break-words">{{ monsterSummary(encounter) }}</p>
            <p v-if="encounter.mapUrl" class="text-sm">Has a map</p>
          </RouterLink>
        </div>
      </div>
    </template>
  </main>
</template>
