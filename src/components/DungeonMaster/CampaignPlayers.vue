<script setup>
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { listMembers, removeMember } from '@/components/modules/useCampaignMembers.js'
import ProfilePicture from '@/components/Account/ProfilePicture.vue'

// The Players tab: everyone who joined with an invite code, and the character they play
const props = defineProps({
  campaignId: { type: String, required: true },
})

const members = ref([])
const loading = ref(true)
const error = ref(null)

onMounted(async () => {
  try {
    members.value = await listMembers(props.campaignId)
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
})

async function onRemove(member) {
  if (!confirm(`Remove ${member.profile.displayName} from the campaign? They can join again with a valid invite code.`)) return
  error.value = null
  try {
    await removeMember(props.campaignId, member.uid)
    members.value = members.value.filter((other) => other.uid !== member.uid)
  } catch (err) {
    error.value = err.message
  }
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <h2 class="text-xl uppercase">Players</h2>

    <p v-if="loading">Loading the players...</p>
    <p v-else-if="error" class="text-red-600">{{ error }}</p>
    <p v-else-if="members.length === 0">Nobody has joined yet. Give your players the code from the Invite tab.</p>

    <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div v-for="member in members" :key="member.uid" class="border-2 border-black rounded-md p-3 flex flex-col gap-2">
        <div class="flex items-center gap-3">
          <ProfilePicture :url="member.profile.photoURL" :name="member.profile.displayName" size="w-12 h-12 text-xl" />
          <div class="min-w-0">
            <p class="text-xl font-bold break-words">{{ member.profile.displayName }}</p>
            <p v-if="member.joinedAt" class="text-xs text-gray-500">joined {{ member.joinedAt.toLocaleDateString() }}</p>
          </div>
        </div>

        <p class="break-words">
          Plays <span class="font-bold">{{ member.character.name }}</span>,
          level {{ member.character.level }} {{ member.character.raceName }} {{ member.character.className }}
        </p>

        <div class="flex justify-end gap-3">
          <button @click="onRemove(member)" class="text-sm text-red-600 cursor-pointer">Remove</button>
          <RouterLink :to="`/DungeonMaster/${campaignId}/player/${member.uid}`" class="text-sm underline hover:text-blue">
            View player and character
          </RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>
