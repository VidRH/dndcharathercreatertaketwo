<script setup>
// A round profile picture. No picture yet -> the first letter of the name instead.
// size = Tailwind width/height classes, so it fits the nav bar as well as the account page
defineProps({
  url: { type: String, default: '' },
  name: { type: String, default: '' },
  size: { type: String, default: 'w-10 h-10' },
})
</script>

<template>
  <img
    v-if="url"
    :src="url"
    :alt="`${name || 'User'}'s picture`"
    :class="[size, 'rounded-full object-cover border-2 border-black bg-paperdarker shrink-0']"
  />
  <div
    v-else
    :class="[size, 'rounded-full border-2 border-black bg-paperdarker text-dark flex items-center justify-center uppercase shrink-0']"
  >
    {{ name?.[0] || '?' }}
  </div>
</template>
