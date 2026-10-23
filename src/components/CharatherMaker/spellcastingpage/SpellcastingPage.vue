<script setup>
import SpellLevelPart from './SpellLevelPart.vue'
import { selectedClass } from '../../modules/useSelectedClass.js'
import { level } from '../../modules/useLevelState.js'
import { ABILITY_FULL_NAMES, formatModifier } from '../../modules/useAbilityScores.js'
import {
  isSpellcaster,
  castingStartsAt,
  spellcastingAbility,
  spellSaveDc,
  spellAttackBonus,
  cantripsKnown,
  cantripsPicked,
  learnsFixedSpells,
  spellLimit,
  spellsPicked,
} from '../../modules/useSpells.js'

// How many dropdowns each spell level gets (same as the paper character sheet)
const ROWS = { 0: 8, 1: 12, 2: 13, 3: 13, 4: 13, 5: 9, 6: 9, 7: 9, 8: 7, 9: 7 }
</script>

<template>
  <div class="flex justify-center items-center gap-25"> <!-- spellcasting class, spellcasting ability, spell save dc, spell attack bonus -->
    <label for="spellcastingClass" class="flex flex-col text-center">
      <input id="spellcastingClass" type="text" readonly :value="isSpellcaster ? selectedClass.name : ''" placeholder="Spellcasting Class" class="border-2 border-black rounded-md p-1 m-1 w-100 h-15 text-center">
      Spellcasting class
    </label>
    <div class="flex flex-row gap-7">
      <label for="spellcastingAbility" class="flex flex-col text-center">
        <input id="spellcastingAbility" type="text" readonly :value="isSpellcaster ? ABILITY_FULL_NAMES[spellcastingAbility] : ''" placeholder="Spellcasting Ability" class="border-2 border-black rounded-md p-1 m-1 h-15 text-center" />
        spellcasting ability
      </label >
      <label for="spellSaveDc" class="flex flex-col text-center">
        <input id="spellSaveDc" type="text" readonly :value="spellSaveDc ?? ''" placeholder="Spell Save DC" class="border-2 border-black rounded-md p-1 m-1 h-15 text-center" />
        spell save dc
      </label>
      <label for="spellAttackBonus" class="flex flex-col text-center">
        <input id="spellAttackBonus" type="text" readonly :value="spellAttackBonus === null ? '' : formatModifier(spellAttackBonus)" placeholder="Spell Attack Bonus" class="border-2 border-black rounded-md p-1 m-1 h-15 text-center" />
        spell attack bonus
      </label>
    </div>
  </div>

  <!-- how many spells you may still pick, or why you can't -->
  <div class="flex justify-center gap-10 my-4 text-lg">
    <p v-if="!selectedClass">Pick a class first.</p>
    <p v-else-if="!isSpellcaster">{{ selectedClass.name }}s can't cast spells.</p>
    <p v-else-if="level < castingStartsAt">{{ selectedClass.name }}s start casting spells at level {{ castingStartsAt }}.</p>
    <template v-else>
      <p v-if="cantripsKnown > 0" :class="{ 'font-bold': cantripsPicked === cantripsKnown }">
        Cantrips known: {{ cantripsPicked }} / {{ cantripsKnown }}
      </p>
      <p :class="{ 'font-bold': spellsPicked === spellLimit }">
        {{ learnsFixedSpells ? 'Spells known' : 'Spells prepared' }}: {{ spellsPicked }} / {{ spellLimit }}
      </p>
    </template>
  </div>

  <div class="grid grid-cols-3 gap-7 justify-center w-full"> <!-- spells known, spell slots -->
    <div class="w-full col-start-1 ">
      <SpellLevelPart :level="0" :rows="ROWS[0]" />
      <SpellLevelPart :level="1" :rows="ROWS[1]" />
      <SpellLevelPart :level="2" :rows="ROWS[2]" />
    </div>
    <div class="w-full col-start-2 ">
      <SpellLevelPart :level="3" :rows="ROWS[3]" />
      <SpellLevelPart :level="4" :rows="ROWS[4]" />
      <SpellLevelPart :level="5" :rows="ROWS[5]" />
    </div >
    <div class="w-full col-start-3">
      <SpellLevelPart :level="6" :rows="ROWS[6]" />
      <SpellLevelPart :level="7" :rows="ROWS[7]" />
      <SpellLevelPart :level="8" :rows="ROWS[8]" />
      <SpellLevelPart :level="9" :rows="ROWS[9]" />
    </div>
  </div>

</template>

<style scoped>

</style>
