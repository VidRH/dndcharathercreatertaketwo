<script setup>
// ONE question in a popup ("Choose 2 skills", "Fighting Style", ...).
// Used by both the class/race/background popup and the level-up popup.
import { isQuestionDone, toggleOption, setPick } from '../modules/useChoicePopup.js'
import { alreadyKnown, canDouble } from '../modules/useAlreadyKnown.js'
import { expertise } from '../modules/useLevelState.js'

const props = defineProps({
  question: { type: Object, required: true },
  // every question in the same popup, so two dropdowns can't pick the same language
  allQuestions: { type: Array, required: true },
})

// (a), (b), (c)... like in the rule book
const letter = (i) => `(${String.fromCharCode(97 + i)})`

// With "choose 2" you can't tick a 3rd one until you untick one
const isFull = (i) =>
  props.question.choose > 1 &&
  props.question.selected.length >= props.question.choose &&
  !props.question.selected.includes(i)

// Why a tick box is greyed out ('' = it isn't)
function blockedReason(option) {
  const indexes = option.grants.map((grant) => grant.index)

  // Expertise is the opposite of normal: you can ONLY pick skills you already have
  if (props.question.mustKnow) {
    if (indexes.some((index) => !alreadyKnown.value.has(index))) return 'not proficient'
    if (indexes.some((index) => expertise.value.has(index))) return 'already expert'
    return ''
  }

  // No doubles for languages, skills, tools, fighting styles...
  if (canDouble(props.question.type)) return ''
  return indexes.some((index) => alreadyKnown.value.has(index)) ? 'already have' : ''
}

// Dropdown entry: greyed out if you already have it, OR you picked it in another dropdown in this popup
function itemTaken(pick, itemIndex) {
  if (canDouble(pick.type)) return false
  if (alreadyKnown.value.has(itemIndex)) return true
  return props.allQuestions.some((question) =>
    question.selected.some((i) =>
      question.options[i].picks.some((other) => other !== pick && other.value === itemIndex),
    ),
  )
}
</script>

<template>
  <div class="mb-6">
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
          :disabled="isFull(i) || blockedReason(option) !== ''"
          @change="toggleOption(question, i)"
        />
        <span :class="{ 'opacity-40': blockedReason(option) }">
          <span v-if="question.type === 'equipment'">{{ letter(i) }} </span>{{ option.label }}
          <span v-if="blockedReason(option)" class="text-sm">({{ blockedReason(option) }})</span>
        </span>
      </label>

      <!-- options like "a martial weapon" get a dropdown so you can say WHICH one -->
      <select
        v-for="(pick, p) in option.picks"
        :key="p"
        :value="pick.value"
        @change="setPick(pick, $event.target.value)"
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
</template>
