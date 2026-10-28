<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

// An encounter map. Click it to see it full screen, click again or press Escape to close.
defineProps({
  url: { type: String, required: true },
  alt: { type: String, default: 'Encounter map' },
})

const open = ref(false)

function onKeydown(event) {
  if (event.key === 'Escape') open.value = false
}
onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div>
    <button type="button" @click="open = true" class="w-full cursor-zoom-in" title="Click to see it big">
      <img :src="url" :alt="alt" class="w-full max-h-96 object-contain border bg-paperdarker" />
    </button>

    <!-- fixed + inset-0 = covers the whole screen, on top of everything -->
    <div v-if="open" @click="open = false" class="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 cursor-zoom-out">
      <img :src="url" :alt="alt" class="max-w-full max-h-full object-contain" />
    </div>
  </div>
</template>
