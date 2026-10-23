<script setup>
import { computed } from 'vue'
import { featuresText } from '../modules/useLevel.js'

import { raceTraitsText } from '../modules/useSelectedRace.js'
import { personalityTraits, ideals, bonds, flaws } from '../modules/useCharacterInfo.js'

// Class features first, then race traits, with an empty line between (skip empty ones)
const featuresAndTraits = computed(() =>
  [featuresText.value, raceTraitsText.value].filter((text) => text !== '').join('\n\n'),
)
</script>

<template>
  <main>
    <div class="w-full">
      <div class=" w-full flex flex-col  h-50">
          <textarea v-model="personalityTraits" id="personalityTraits" class="border-2 border-black rounded-md mt-2 h-full"></textarea>
          <label for="personalityTraits" class="flex justify-center items-center">personality traits</label>
      </div>
      <div class=" w-full flex flex-col h-50">
        <textarea v-model="ideals" id="ideals" class="border-2 border-black rounded-md mt-2 h-full"></textarea>
        <label for="ideals" class="flex justify-center items-center">ideals</label>
      </div>
      <div class=" w-full flex flex-col h-50">
        <textarea v-model="bonds" id="bonds" class="border-2 border-black rounded-md mt-2 h-full"></textarea>
        <label for="bonds" class="flex justify-center items-center">bonds</label>
      </div>
      <div class=" w-full flex flex-col h-50">
        <textarea v-model="flaws" id="flaws" class="border-2 border-black rounded-md mt-2 h-full"></textarea>
        <label for="flaws" class="flex justify-center items-center">flaws</label>
      </div>
    </div>
    <div class=" w-full flex flex-col h-192.5">
      <textarea id="features&traits" class="border-2 border-black rounded-md mt-2 h-full" :value="featuresAndTraits"></textarea>
      <label for="features&traits" class="flex justify-center items-center">Fetures & Traits</label>
     </div>
  </main>
</template>

<style scoped></style>
