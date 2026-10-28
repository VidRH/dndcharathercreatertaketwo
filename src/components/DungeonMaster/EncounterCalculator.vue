<script setup>
import { computed } from 'vue'
import { calculateEncounter, DIFFICULTIES } from '@/components/modules/useEncounterMath.js'

// The numbers panel of an encounter: how much XP and how hard it is for the party
const props = defineProps({
  monsters: { type: Array, required: true },
})
// String too: a number box that's been emptied gives back ''
const partySize = defineModel('partySize', { type: [Number, String], default: 4 })
const partyLevel = defineModel('partyLevel', { type: [Number, String], default: 1 })

const result = computed(() => calculateEncounter(props.monsters, partySize.value, partyLevel.value))

const difficultyColors = {
  Trivial: 'bg-paperdarker',
  Easy: 'bg-green',
  Medium: 'bg-greendarker',
  Hard: 'bg-red',
  Deadly: 'bg-reddarker text-white',
}
</script>

<template>
  <section class="border-2 border-black rounded-md p-4 flex flex-col gap-3">
    <h2 class="text-xl uppercase">Calculations</h2>

    <div class="flex flex-wrap gap-4">
      <label class="flex flex-col gap-1">
        Players
        <input v-model.number="partySize" type="number" min="1" max="10" class="border p-2 w-24" />
      </label>
      <label class="flex flex-col gap-1">
        Their level
        <input v-model.number="partyLevel" type="number" min="1" max="20" class="border p-2 w-24" />
      </label>
    </div>

    <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
      <div class="border p-2">
        <p class="text-xs text-gray-500">Monsters</p>
        <p class="text-lg">{{ result.monsterCount }}</p>
      </div>
      <div class="border p-2">
        <p class="text-xs text-gray-500">Total XP</p>
        <p class="text-lg">{{ result.totalXp.toLocaleString() }}</p>
      </div>
      <div class="border p-2">
        <p class="text-xs text-gray-500">XP per player</p>
        <p class="text-lg">{{ result.xpPerPlayer.toLocaleString() }}</p>
      </div>
      <div class="border p-2">
        <p class="text-xs text-gray-500">Multiplier</p>
        <p class="text-lg">&times;{{ result.multiplier }}</p>
      </div>
      <div class="border p-2">
        <p class="text-xs text-gray-500">Adjusted XP</p>
        <p class="text-lg">{{ result.adjustedXp.toLocaleString() }}</p>
      </div>
      <div :class="['border p-2', difficultyColors[result.difficulty]]">
        <p class="text-xs">Difficulty</p>
        <p class="text-lg">{{ result.difficulty }}</p>
      </div>
    </div>

    <!-- the party's thresholds, so you can see how close the next step is -->
    <p class="text-lg">
      Party thresholds:
      <span v-for="(difficulty, i) in DIFFICULTIES" :key="difficulty">
        {{ difficulty }} {{ result.thresholds[difficulty].toLocaleString() }}<template v-if="i < DIFFICULTIES.length - 1">, </template>
      </span>
    </p>
    <p class="text-md text-gray-500">
      Adjusted XP = total XP &times; a multiplier for the number of monsters (Dungeon Master's Guide).
      It's only used for the difficulty; players share the total XP.
    </p>
  </section>
</template>
