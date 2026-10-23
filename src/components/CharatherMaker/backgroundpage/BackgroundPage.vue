<script setup>
import BackgroundTopPart from './BackgroundTopPart.vue'
import {
  appearance,
  backstory,
  allies,
  symbols,
  additionalFeatures,
  treasure,
} from '../../modules/useCharacterInfo.js'
</script>

<template class="w-full flex flex-col gap-2.5">
  <div class="mb-15"> <!--top part includes: name age height eye color weight skin and hair-->
    <BackgroundTopPart />
  </div>
  <div class="grid-cols-3 grid m-1 gap-2.5">
    <div class="col-start-1"> <!-- left part includes charather appearance charather backstory -->
      <label for="appearance" class="flex flex-col text-center">
        <textarea v-model="appearance" placeholder="Character Appearance" class="border-2 border-black rounded-md w-full h-100"></textarea>
        Character Appearance
      </label>
      <label for="backstory" class="flex flex-col text-center">
        <textarea v-model="backstory" placeholder="Character Backstory" class="border-2 border-black rounded-md w-full h-205.75"></textarea>
        Character Backstory
      </label>
    </div>
    <div class="col-start-2 col-span-2 m-r-1 gap-2.5"> <!-- right/middle part allies and orginasations w/ symnols ,additional features and traits, treasure -->
      <div id="symbols" class="flex flex-row h-105.75 gap-2.5"> <!-- allies and orginasations w/ symnols -->
        <label for="allies" class="flex flex-col text-center w-1/2">
          <textarea v-model="allies" placeholder="Allies and Organizations" class="border-2 border-black rounded-md h-full"></textarea>
          Allies and Organizations
        </label>
        <label for="symbols" class="flex flex-col text-center w-1/2">
          <textarea v-model="symbols" placeholder="Symbols" class="border-2 border-black rounded-md h-full"></textarea>
          Symbols
        </label>
      </div>

      <label for="additional-features" class="flex flex-col text-center">
        <textarea v-model="additionalFeatures" placeholder="Additional Features and Traits" class="border-2 border-black rounded-md w-full h-100"></textarea>
        Additional Features and Traits
      </label>
      <label for="treasure" class="flex flex-col text-center">
        <textarea v-model="treasure" placeholder="Treasure" class="border-2 border-black rounded-md w-full h-100"></textarea>
        Treasure
      </label>

    </div>
  </div>
</template>

<style scoped></style>
