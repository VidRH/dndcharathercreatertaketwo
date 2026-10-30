<script setup>
import { ref } from 'vue'

const rolls = ref({})

function rollD20E(roll) {
  rolls.value[roll] = Math.floor(Math.random() * 20) + 1
}

</script>

<template>
  <main class="flex flex-col gap-4 max-w-3xl mx-auto p-4">
    <h1 class="text-3xl uppercase">Welcome to the D&D Character Creator</h1>
    <p class="text-lg">
      This site is a tool not the game itself. It will not run your game, it will not replace your own intuiton and your own agency, and it will certainly not replace the best part of dungeons and dragons:
       <span><button  class="text-blue font-bold " @click="rollD20E('d20')" >rolling the dice</button></span>
        (okay it might do that once)
    </p>

    <p v-if="rolls.d20" class="text-2xl text-center">You found a secret and rolled a  {{ rolls.d20 }}</p>
  </main>
</template>
