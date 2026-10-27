<script setup>
import { ref, computed } from 'vue'
import { STATUS_OPTIONS } from '@/components/modules/useCampaignCharacters.js'

// A dropdown of the usual statuses, with "Other..." for typing your own.
// v-model is the status text itself, e.g. 'Missing' or 'Turned into a frog'.
const status = defineModel({ type: String, default: '' })

const isCustom = ref(!STATUS_OPTIONS.includes(status.value))

// What the dropdown shows: the status, or 'other' while typing your own
const dropdownValue = computed({
  get: () => (isCustom.value ? 'other' : status.value),
  set: (value) => {
    isCustom.value = value === 'other'
    status.value = isCustom.value ? '' : value
  },
})
</script>

<template>
  <div class="flex flex-col sm:flex-row gap-2">
    <select v-model="dropdownValue" class="border p-2">
      <option v-for="option in STATUS_OPTIONS" :key="option" :value="option">{{ option }}</option>
      <option value="other">Other...</option>
    </select>
    <input v-if="isCustom" v-model="status" type="text" maxlength="60" placeholder="Type the status" class="border p-2 grow" />
  </div>
</template>
