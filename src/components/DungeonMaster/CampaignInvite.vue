<script setup>
import { ref } from 'vue'
import { makeInviteCode, removeInviteCode } from '@/components/modules/useInviteCodes.js'

// The Invite tab: the code players type in on their Campaigns page to join
const props = defineProps({
  campaign: { type: Object, required: true },
})
// 'changed' gives the campaign page the new code ('' = none)
const emit = defineEmits(['changed'])

const working = ref(false)
const error = ref('')
const copied = ref(false)

async function onMakeCode() {
  // A new code makes the old one stop working, so ask first
  if (props.campaign.inviteCode && !confirm('Make a new code? The old one will stop working.')) return
  working.value = true
  error.value = ''
  copied.value = false
  try {
    emit('changed', await makeInviteCode(props.campaign.id, props.campaign.inviteCode))
  } catch (e) {
    error.value = e.message
  } finally {
    working.value = false
  }
}

async function onRemoveCode() {
  if (!confirm('Turn invites off? Nobody new can join until you make a new code.')) return
  working.value = true
  error.value = ''
  try {
    await removeInviteCode(props.campaign.id, props.campaign.inviteCode)
    emit('changed', '')
  } catch (e) {
    error.value = e.message
  } finally {
    working.value = false
  }
}

async function onCopy() {
  try {
    await navigator.clipboard.writeText(props.campaign.inviteCode)
    copied.value = true
  } catch {
    error.value = "Couldn't copy it, please copy the code by hand."
  }
}
</script>

<template>
  <section class="border-2 border-black rounded-md p-4 flex flex-col gap-3">
    <h2 class="text-xl uppercase">Invite players</h2>

    <template v-if="campaign.inviteCode">
      <p>Give your players this code. They type it in on their Campaigns page and pick the character they want to play.</p>
      <div class="flex flex-wrap items-center gap-3">
        <!-- select-all: one click selects the whole code, handy for copying by hand -->
        <p class="text-4xl tracking-widest font-bold border-2 border-black rounded-md px-4 py-2 bg-paperdarker select-all">
          {{ campaign.inviteCode }}
        </p>
        <button type="button" @click="onCopy" class="border-2 border-black rounded-md px-4 py-1 cursor-pointer bg-black text-white">
          {{ copied ? 'Copied!' : 'Copy' }}
        </button>
      </div>
      <div class="flex flex-wrap gap-3">
        <button type="button" @click="onMakeCode" :disabled="working" class="border-2 border-black rounded-md px-4 py-1 cursor-pointer disabled:opacity-50">
          Make a new code
        </button>
        <button type="button" @click="onRemoveCode" :disabled="working" class="text-red-600 cursor-pointer disabled:opacity-50">
          Turn invites off
        </button>
      </div>
      <p class="text-sm text-gray-500">Players who already joined stay in, whatever you do with the code.</p>
    </template>

    <template v-else>
      <p>There's no invite code yet, so nobody can join.</p>
      <button type="button" @click="onMakeCode" :disabled="working" class="self-start border-2 border-black rounded-md px-4 py-1 cursor-pointer bg-black text-white disabled:opacity-50">
        {{ working ? 'Making a code...' : 'Make an invite code' }}
      </button>
    </template>

    <p v-if="error" class="text-red-600">{{ error }}</p>
  </section>
</template>
