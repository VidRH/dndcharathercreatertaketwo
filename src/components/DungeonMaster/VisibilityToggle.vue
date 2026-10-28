<script setup>
// The "can players see this?" switch next to a field. v-model is true when players can see it.
// label (optional) says WHAT is shown or hidden, for when there are several switches in a row
defineProps({
  label: { type: String, default: '' },
})
const visible = defineModel({ type: Boolean, default: false })
</script>

<template>
  <button
    type="button"
    @click="visible = !visible"
    :title="visible ? 'Players can see this. Click to hide it.' : 'Hidden from players. Click to show it.'"
    :class="[
      'text-xs uppercase rounded-md px-2 py-0.5 border-2 cursor-pointer whitespace-nowrap',
      visible ? 'bg-greendarker border-black' : 'border-gray-400 text-gray-500',
    ]"
  >
    <template v-if="label">{{ label }}: {{ visible ? 'shown' : 'hidden' }}</template>
    <template v-else>{{ visible ? 'Shown to players' : 'Hidden' }}</template>
  </button>
</template>
