<script setup>
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { listCharacters } from '@/components/modules/useSavedCharacters.js'
import {
  joinCampaign,
  listJoinedCampaigns,
  switchCharacter,
  leaveCampaign,
} from '@/components/modules/useCampaignMembers.js'

// /Campaigns: join a campaign with an invite code, and see the ones you're in
const campaigns = ref([])
const myCharacters = ref([])
const loading = ref(true)
const error = ref('')

async function loadAll() {
  const [joined, characters] = await Promise.all([listJoinedCampaigns(), listCharacters()])
  campaigns.value = joined
  myCharacters.value = characters
}

onMounted(async () => {
  try {
    await loadAll()
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
})

// e.g. 'Grog, level 3 Goliath Barbarian'
function characterLabel(character) {
  const kind = [character.raceName, character.className].filter(Boolean).join(' ')
  return `${character.name || 'Unnamed character'}, level ${character.level} ${kind}`.trim()
}

// ---------- joining ----------

const code = ref('')
const joinCharacterId = ref('')
const joining = ref(false)
const joinError = ref('')
const joinedMessage = ref('')

async function onJoin() {
  if (!joinCharacterId.value) {
    joinError.value = 'Pick the character you want to play.'
    return
  }
  joining.value = true
  joinError.value = ''
  joinedMessage.value = ''
  try {
    await joinCampaign(code.value, joinCharacterId.value)
    await loadAll()
    code.value = ''
    joinCharacterId.value = ''
    joinedMessage.value = "You're in! The campaign is in your list below."
  } catch (e) {
    joinError.value = e.message
  } finally {
    joining.value = false
  }
}

// ---------- per campaign ----------

// campaignId -> the character picked in its "switch" dropdown
const switchTo = ref({})
const busyCampaignId = ref('')
const campaignError = ref({})

async function onSwitch(campaign) {
  const newCharacterId = switchTo.value[campaign.id]
  if (!newCharacterId || newCharacterId === campaign.characterId) return
  busyCampaignId.value = campaign.id
  campaignError.value[campaign.id] = ''
  try {
    await switchCharacter(campaign.id, campaign.characterId, newCharacterId)
    await loadAll()
    delete switchTo.value[campaign.id] // back to "Switch character..."
  } catch (e) {
    campaignError.value[campaign.id] = e.message
  } finally {
    busyCampaignId.value = ''
  }
}

async function onLeave(campaign) {
  if (!confirm(`Leave ${campaign.name}? You'll need a new invite code to join again.`)) return
  busyCampaignId.value = campaign.id
  campaignError.value[campaign.id] = ''
  try {
    await leaveCampaign(campaign.id, campaign.characterId)
    campaigns.value = campaigns.value.filter((other) => other.id !== campaign.id)
  } catch (e) {
    campaignError.value[campaign.id] = e.message
  } finally {
    busyCampaignId.value = ''
  }
}
</script>

<template>
  <main class="flex flex-col gap-4 max-w-3xl mx-auto p-4">
    <h1 class="text-2xl uppercase">Campaigns</h1>

    <p v-if="loading">Loading your campaigns...</p>
    <p v-else-if="error" class="text-red-600">{{ error }}</p>

    <template v-else>
      <!-- ---------- join ---------- -->
      <form @submit.prevent="onJoin" class="border-2 border-black rounded-md p-4 flex flex-col gap-2">
        <h2 class="text-xl uppercase">Join a campaign</h2>

        <p v-if="myCharacters.length === 0">
          You need a character to join with.
          <RouterLink to="/CharatherMaker" class="underline hover:text-blue">Make one first!</RouterLink>
        </p>

        <template v-else>
          <input v-model="code" type="text" placeholder="Invite code from your DM" required maxlength="20" autocomplete="off" class="border p-2 uppercase tracking-widest" />
          <select v-model="joinCharacterId" required class="border p-2">
            <option value="" disabled>Pick the character you'll play</option>
            <option v-for="character in myCharacters" :key="character.id" :value="character.id">
              {{ characterLabel(character) }}
            </option>
          </select>
          <p class="text-sm text-gray-500">Your DM will be able to see your profile and this character's sheet.</p>
          <p v-if="joinError" class="text-red-600">{{ joinError }}</p>
          <p v-if="joinedMessage" class="text-green-700">{{ joinedMessage }}</p>
          <button type="submit" :disabled="joining" class="self-end border-2 border-black rounded-md px-4 py-1 cursor-pointer bg-black text-white disabled:opacity-50">
            {{ joining ? 'Joining...' : 'Join' }}
          </button>
        </template>
      </form>

      <!-- ---------- the campaigns you're in ---------- -->
      <h2 class="text-xl uppercase">My campaigns</h2>
      <p v-if="campaigns.length === 0">You haven't joined a campaign yet.</p>

      <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div v-for="campaign in campaigns" :key="campaign.id" class="border-2 border-black rounded-md p-3 flex flex-col gap-2">
          <p class="text-xl font-bold break-words">{{ campaign.name }}</p>
          <p v-if="campaign.shortDescription" class="break-words">{{ campaign.shortDescription }}</p>
          <p class="text-sm">Playing as <span class="font-bold">{{ characterLabel(campaign.character) }}</span></p>

          <!-- play with another character -->
          <div v-if="myCharacters.length > 1" class="flex flex-col sm:flex-row gap-2">
            <select v-model="switchTo[campaign.id]" class="border p-1 grow min-w-0 text-sm">
              <option :value="undefined" disabled>Switch character...</option>
              <option v-for="character in myCharacters.filter((c) => c.id !== campaign.characterId)" :key="character.id" :value="character.id">
                {{ characterLabel(character) }}
              </option>
            </select>
            <button
              type="button"
              @click="onSwitch(campaign)"
              :disabled="!switchTo[campaign.id] || busyCampaignId === campaign.id"
              class="border-2 border-black rounded-md px-3 py-0.5 text-sm cursor-pointer disabled:opacity-50"
            >
              Switch
            </button>
          </div>

          <p v-if="campaignError[campaign.id]" class="text-red-600 text-sm">{{ campaignError[campaign.id] }}</p>
          <button type="button" @click="onLeave(campaign)" :disabled="busyCampaignId === campaign.id" class="self-end text-sm text-red-600 cursor-pointer disabled:opacity-50">
            Leave campaign
          </button>
        </div>
      </div>
    </template>
  </main>
</template>
