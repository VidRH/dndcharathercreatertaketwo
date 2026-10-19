<script setup>
import { computed } from 'vue'
import { popup, confirmPopup, cancelPopup, isQuestionDone } from '../modules/useChoicePopup.js'
import ChoiceQuestion from './ChoiceQuestion.vue'

// Confirm button only works when every question is answered
const allDone = computed(() => popup.value.questions.every(isQuestionDone))
</script>

<template>
  <!-- dark see-through background that covers the whole page -->
  <div v-if="popup" class="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
    <div class="bg-paperdarker border-black rounded-md p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
      <h2 class="text-2xl mb-4">{{ popup.title }}</h2>

      <ChoiceQuestion
        v-for="(question, q) in popup.questions"
        :key="q"
        :question="question"
        :all-questions="popup.questions"
      />

      <div class="flex justify-end gap-2.5">
        <button class="border-2 border-black rounded-md px-4 py-1" @click="cancelPopup">Skip</button>
        <button
          class="border-2 border-black rounded-md px-4 py-1 bg-black text-white disabled:opacity-40"
          :disabled="!allDone"
          @click="confirmPopup"
        >
          Confirm
        </button>
      </div>
    </div>
  </div>
</template>
