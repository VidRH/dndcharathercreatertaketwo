<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { getMemberWithSheet } from '@/components/modules/useCampaignMembers.js'
import { loadCharacterData, resetCharacter } from '@/components/modules/useCharacterData.js'
import ProfilePicture from '@/components/Account/ProfilePicture.vue'
import CharatherMakerTopPart from '@/components/CharatherMaker/NameHeaderTopPart.vue'
import CharatherMakerLeftPart from '@/components/CharatherMaker/AttributesLeftPart.vue'
import CharatherMakerMiddlePart from '@/components/CharatherMaker/ArmorInventoryMiddlePart.vue'
import CharatherMakerRightPart from '@/components/CharatherMaker/BackstoryRightPart.vue'
import BackgroundPage from '@/components/CharatherMaker/backgroundpage/BackgroundPage.vue'
import SpellcastingPage from '@/components/CharatherMaker/spellcastingpage/SpellcastingPage.vue'

// The DM's look at one player: /DungeonMaster/:campaignId/player/:uid
// Their profile, and the character they play, on the normal character sheet but read-only.
const route = useRoute()
const campaignId = route.params.campaignId
const backToCampaign = `/DungeonMaster/${campaignId}?tab=players`

const member = ref(null)
const loading = ref(true)
const error = ref('')

// The same three pages as in the character maker
const pages = [
  { id: 'sheet', label: 'Character Sheet' },
  { id: 'background', label: 'Background' },
  { id: 'spells', label: 'Spells' },
]
const currentPage = ref('sheet')

onMounted(async () => {
  try {
    member.value = await getMemberWithSheet(campaignId, route.params.uid)
    // The sheet parts show whatever character is loaded, so load the player's one.
    // (The character maker loads or wipes the sheet itself when you open it, so your own are safe.)
    if (member.value.sheet) loadCharacterData(member.value.sheet)
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
})

// Don't leave someone else's character on the sheet
onUnmounted(resetCharacter)

const roleNames = { player: 'Player', dm: 'Dungeon Master', admin: 'Admin' }
</script>

<template>
  <main class="flex flex-col gap-4 p-4">
    <RouterLink :to="backToCampaign" class="self-start hover:text-blue">&larr; Back to the players</RouterLink>

    <p v-if="loading">Loading the player...</p>
    <p v-else-if="error" class="text-red-600">{{ error }}</p>

    <template v-else>
      <!-- ---------- the player's account ---------- -->
      <section class="border-2 border-black rounded-md p-4 flex flex-col sm:flex-row gap-4 w-full max-w-3xl mx-auto">
        <ProfilePicture :url="member.profile.photoURL" :name="member.profile.displayName" size="w-24 h-24 text-4xl" class="self-center sm:self-start" />
        <div class="flex flex-col gap-1 min-w-0">
          <p class="text-2xl font-bold break-words">{{ member.profile.displayName }}</p>
          <p v-if="roleNames[member.profile.role]">
            <span class="bg-dark text-white rounded-md px-2 py-0.5 text-sm uppercase">{{ roleNames[member.profile.role] }}</span>
          </p>
          <p v-if="member.joinedAt" class="text-xs text-gray-500">joined the campaign {{ member.joinedAt.toLocaleDateString() }}</p>
          <p v-if="member.profile.description" class="mt-2 whitespace-pre-line break-words">{{ member.profile.description }}</p>
          <p v-else class="mt-2 text-gray-500">No description.</p>
        </div>
      </section>

      <!-- ---------- their character ---------- -->
      <p v-if="!member.sheet" class="text-center">There's no copy of their character yet.</p>

      <template v-else>
        <p class="text-center text-sm text-gray-500">
          Read-only: {{ member.character.name }} as {{ member.profile.displayName }} last saved them.
        </p>

        <nav class="sm:flex sm:justify-center max-sm:grid max-sm:grid-cols-2 gap-2.5">
          <button
            v-for="page in pages"
            :key="page.id"
            @click="currentPage = page.id"
            class="border-2 border-black rounded-md px-4 py-1 hover:bg-paperdarker text-lg cursor-pointer"
            :class="currentPage === page.id ? 'bg-paperdarker font-bold' : 'opacity-60'"
          >
            {{ page.label }}
          </button>
        </nav>

        <!-- a disabled fieldset turns off every input and button inside it: look, don't touch -->
        <fieldset disabled>
          <div v-show="currentPage === 'sheet'">
            <CharatherMakerTopPart class="w-80% my-7" />
            <div class="xl:flex xl:flex-rows grid sm:grid-cols-2 grid-cols-1 justify-between flex-nonwrap w-80%">
              <CharatherMakerLeftPart class="xl:w-1/3 col-span-1" />
              <CharatherMakerMiddlePart class="xl:w-1/3 col-span-1" />
              <CharatherMakerRightPart class="xl:w-1/3 col-span-1" />
            </div>
          </div>

          <div v-show="currentPage === 'background'">
            <BackgroundPage />
          </div>

          <div v-show="currentPage === 'spells'">
            <SpellcastingPage />
          </div>
        </fieldset>
      </template>
    </template>
  </main>
</template>
