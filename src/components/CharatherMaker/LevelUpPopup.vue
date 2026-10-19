<script setup>
import { computed } from 'vue'
import {
  levelPopup,
  confirmLevelPopup,
  cancelLevelPopup,
  isPageDone,
  rollHitDie,
  hitDie,
  averageHp,
} from '../modules/useLevel.js'
import { ABILITY_FULL_NAMES, abilityTotal } from '../modules/useAbilityScores.js'
import ChoiceQuestion from './ChoiceQuestion.vue'

// All questions from all pages, so two dropdowns can't pick the same thing
const allQuestions = computed(() => levelPopup.value.pages.flatMap((page) => page.questions))

// Confirm button only works when every page is filled in
const allDone = computed(() => levelPopup.value.pages.every(isPageDone))

// An Ability Score Improvement can't push a score above 20.
// Counts the +1s already picked in this popup (except the dropdown we're checking).
function asiTooHigh(page, slot, abilityIndex) {
  let pending = 0
  for (const otherPage of levelPopup.value.pages) {
    const picks = otherPage.asi ?? []
    picks.forEach((ability, otherSlot) => {
      const isThisDropdown = otherPage === page && otherSlot === slot
      if (ability === abilityIndex && !isThisDropdown) pending++
    })
  }
  return abilityTotal(abilityIndex) + pending + 1 > 20
}
</script>

<template>
  <!-- dark see-through background that covers the whole page -->
  <div v-if="levelPopup" class="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
    <div class="bg-paperdarker border-black rounded-md p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
      <h2 class="text-2xl mb-4">{{ levelPopup.title }}</h2>

      <!-- one section per new level -->
      <section v-for="page in levelPopup.pages" :key="page.level" class="mb-6 pt-2 border-t-2 border-black">
        <h3 class="text-xl font-bold" :class="{ 'text-green-700': isPageDone(page) }">Level {{ page.level }}</h3>

        <!-- what you get for free -->
        <p v-if="page.newProfBonus">Proficiency bonus goes up to <b>+{{ page.profBonus }}</b></p>
        <p v-if="page.subclassName">Subclass: <b>{{ page.subclassName }}</b></p>
        <p v-if="page.features.length">New features: {{ page.features.join(', ') }}</p>

        <!-- hit points: take the safe average or gamble on a roll -->
        <div v-if="page.hp" class="my-3">
          <p class="font-bold">Hit points</p>
          <label class="flex items-center gap-2.5">
            <input type="radio" :name="`hp-${page.level}`" value="average" v-model="page.hp.mode" class="w-5 h-5" />
            Take the average ({{ averageHp }})
          </label>
          <label class="flex items-center gap-2.5">
            <input type="radio" :name="`hp-${page.level}`" value="roll" v-model="page.hp.mode" class="w-5 h-5" />
            Roll a d{{ hitDie }}
            <button
              v-if="page.hp.mode === 'roll'"
              @click="rollHitDie(page)"
              :disabled="page.hp.roll !== null"
              class="border-2 border-black rounded-md px-2 disabled:opacity-40"
            >
              🎲 Roll
            </button>
            <b v-if="page.hp.mode === 'roll' && page.hp.roll !== null">you rolled {{ page.hp.roll }}</b>
          </label>
          <p class="text-xs text-gray-500">Your CON modifier is added on top.</p>
        </div>

        <!-- ability score improvement: two +1s (pick the same one twice for +2) -->
        <div v-if="page.asi" class="my-3">
          <p class="font-bold">Ability Score Improvement</p>
          <p class="text-xs text-gray-500">Pick the same ability twice for +2. Scores can't go above 20.</p>
          <div class="flex gap-2.5">
            <select
              v-for="(ability, slot) in page.asi"
              :key="slot"
              v-model="page.asi[slot]"
              class="border-2 border-black rounded-md p-1"
            >
              <option value="" disabled>+1 to...</option>
              <option
                v-for="(name, abilityIndex) in ABILITY_FULL_NAMES"
                :key="abilityIndex"
                :value="abilityIndex"
                :disabled="asiTooHigh(page, slot, abilityIndex)"
              >
                {{ name }} ({{ abilityTotal(abilityIndex) }})
              </option>
            </select>
          </div>
        </div>

        <!-- feature choices: fighting style, expertise, favored enemy... -->
        <ChoiceQuestion
          v-for="(question, q) in page.questions"
          :key="q"
          :question="question"
          :all-questions="allQuestions"
        />
      </section>

      <div class="flex justify-end gap-2.5">
        <button class="border-2 border-black rounded-md px-4 py-1" @click="cancelLevelPopup">Cancel</button>
        <button
          class="border-2 border-black rounded-md px-4 py-1 bg-black text-white disabled:opacity-40"
          :disabled="!allDone"
          @click="confirmLevelPopup"
        >
          Confirm
        </button>
      </div>
    </div>
  </div>
</template>
