<script setup>
import { computed } from 'vue'
import { popup, confirmPopup, cancelPopup, isQuestionDone } from '../modules/useChoicePopup.js'
import { alreadyKnown, canDouble } from '../modules/useAlreadyKnown.js'

// Confirm button only works when every question is answered
const allDone = computed(() => popup.value.questions.every(isQuestionDone))

// (a), (b), (c)... like in the rule book
const letter = (i) => `(${String.fromCharCode(97 + i)})`

// Tick/untick an option. With "choose 1" picking a new one swaps it, like a radio button.
function toggle(question, i) {
  if (question.selected.includes(i)) {
    question.selected = question.selected.filter((x) => x !== i)
  } else if (question.choose === 1) {
    question.selected = [i]
  } else if (question.selected.length < question.choose) {
    question.selected.push(i)
  }
}

// With "choose 2" you can't tick a 3rd one until you untick one
const isFull = (question, i) =>
  question.choose > 1 && question.selected.length >= question.choose && !question.selected.includes(i)

// --- No doubles for languages, skills and tools ---

// Tick box: greyed out if it gives you something you already have (e.g. a skill from your background)
function optionAlreadyKnown(question, option) {
  if (canDouble(question.type)) return false
  return option.grants.some((grant) => alreadyKnown.value.has(grant.index))
}

// Dropdown entry: greyed out if you already have it, OR you picked it in another dropdown in this popup
function itemTaken(pick, itemIndex) {
  if (canDouble(pick.type)) return false
  if (alreadyKnown.value.has(itemIndex)) return true
  return popup.value.questions.some((question) =>
    question.selected.some((i) =>
      question.options[i].picks.some((other) => other !== pick && other.value === itemIndex),
    ),
  )
}
</script>

<template>
  <!-- dark see-through background that covers the whole page -->
  <div v-if="popup" class="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
    <div class="bg-paperdarker border-black rounded-md p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
      <h2 class="text-2xl mb-4">{{ popup.title }}</h2>

      <div v-for="(question, q) in popup.questions" :key="q" class="mb-6">
        <p class="font-bold">
          {{ question.title }}
          <span class="text-sm text-gray-500" :class="{ 'text-green-700': isQuestionDone(question) }">({{ question.hint }})</span>
        </p>

        <div v-for="(option, i) in question.options" :key="i" class="flex flex-wrap items-center gap-2.5 my-1">
          <label v-if="!question.fixed" class="flex items-center gap-2.5">
            <input
              type="checkbox"
              class="w-5 h-5"
              :checked="question.selected.includes(i)"
              :disabled="isFull(question, i) || optionAlreadyKnown(question, option)"
              @change="toggle(question, i)"
            />
            <span :class="{ 'opacity-40': optionAlreadyKnown(question, option) }">
              <span v-if="question.type === 'equipment'">{{ letter(i) }} </span>{{ option.label }}
              <span v-if="optionAlreadyKnown(question, option)" class="text-sm">(already have)</span>
            </span>
          </label>

          <!-- options like "a martial weapon" get a dropdown so you can say WHICH one -->
          <select
            v-for="(pick, p) in option.picks"
            :key="p"
            v-model="pick.value"
            :disabled="!question.selected.includes(i)"
            class="border-2 border-black rounded-md p-1 disabled:opacity-40"
          >
            <option value="" disabled>{{ pick.label }}</option>
            <option v-for="item in pick.list" :key="item.index" :value="item.index" :disabled="itemTaken(pick, item.index)">
              {{ item.name }}{{ itemTaken(pick, item.index) ? ' (taken)' : '' }}
            </option>
          </select>
        </div>
      </div>

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
