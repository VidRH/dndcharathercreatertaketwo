<script setup>
// ONE spell level block (cantrips, level 1, level 2...). The spell page uses it 10 times.
import {
  chosenSpells,
  slotTotal,
  spellOptions,
  isSpellLevelAvailable,
  canUseRow,
  isSpellTaken,
  setSpell,
} from '../../modules/useSpells.js'

defineProps({
  level: { type: Number, required: true }, // 0 = cantrips
  rows: { type: Number, required: true }, // how many spell dropdowns
})
</script>

<template>
  <!-- header: cantrips just say "cantrips", spell levels show their slots -->
  <div
    v-if="level === 0"
    class="flex flex-row gap-2.5 w-full border-2 border-black rounded-md p-1 m-1 h-15"
    :class="{ 'opacity-50': !isSpellLevelAvailable(0) }"
  >
    <p>0</p>
    <p class="text-nowrap">cantrips</p>
  </div>
  <div
    v-else
    class="flex flex-row justify-between gap-2.5 w-full border-2 border-black rounded-md p-1 m-1 h-20"
    :class="{ 'opacity-50': !isSpellLevelAvailable(level) }"
  >
    <label class="flex flex-col justify-center">
      <p class="text-nowrap">Spell levels</p>
      <p class="text-center">{{ level }}</p>
    </label>
    <label>
      <p class="text-center text-nowrap">slot total</p>
      <!-- comes from your class and level -->
      <input type="number" readonly :value="slotTotal(level)" class="border-b-2 border-black p-1 m-1">
    </label>
    <label>
      <p class="text-center text-nowrap">slots expended</p>
      <!-- yours to fill in while playing -->
      <input type="number" min="0" :max="slotTotal(level)" class="border-b-2 border-black p-1 m-1">
    </label>
  </div>

  <!-- the spell dropdowns. Key = "spellLevel-row", e.g. "1-3" -->
  <div class="mx-4">
    <select
      v-for="row in rows"
      :key="row"
      :value="chosenSpells[`${level}-${row}`] ?? ''"
      @change="setSpell(`${level}-${row}`, $event.target.value)"
      :disabled="!canUseRow(level, `${level}-${row}`)"
      class="border-b-2 border-black p-1 m-1 w-full h-10 disabled:opacity-40"
    >
      <option value="">—</option>
      <option
        v-for="spell in spellOptions(level)"
        :key="spell.index"
        :value="spell.index"
        :disabled="isSpellTaken(spell.index, `${level}-${row}`)"
      >
        {{ spell.name }}{{ isSpellTaken(spell.index, `${level}-${row}`) ? ' (taken)' : '' }}
      </option>
    </select>
  </div>
</template>
