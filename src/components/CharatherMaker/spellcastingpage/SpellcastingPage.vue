<script setup>
import CantripsPart from './CantripsPart.vue'
import LevelOneSpellsPart from './LevelOneSpellsPart.vue'
import LevelTwoSpellsPart from './LevelTwoSpellsPart.vue'

import LevelThreeSpellsPart from './LevelThreeSpellsPart.vue'
import LevelFourSpellsPart from './LevelFourSpellsPart.vue'
import LevelFiveSpellsPart from './LevelFIveSpellsPart.vue'

import LevelSixSpellsPart from './LevelSixSpellsPart.vue'
import LevelSevenSpellsPart from './LevelSevenSpellsPart.vue'
import LevelEightSpellsPart from './LevelEightSpellsPart.vue'
import LevelNineSpellsPart from './LevelNineSpellsPart.vue'
</script>

<template>
  <div class="flex justify-center items-center gap-25"> <!-- spellcasting class, spellcasting ability, spell save dc, spell attack bonus, spells known, spell slots -->
    <label for="spellcastingClass" class="flex flex-col text-center">
      <input type="text" placeholder="Spellcasting" class="border-2 border-black rounded-md p-1 m-1 w-100 h-15">
      Spellcasting class
    </label>
    <div class="flex flex-row gap-7">
      <label for="spellcastingAbility" class="flex flex-col text-center">
        <input type="text" placeholder="Spellcasting Class" class="border-2 border-black rounded-md p-1 m-1 h-15" />
        spellcasting ability
      </label >
      <label for="spellSaveDc" class="flex flex-col text-center">
        <input type="text" placeholder="Spellcasting Ability" class="border-2 border-black rounded-md p-1 m-1 h-15" />
        spell save dc
      </label>
      <label for="spellAttackBonus" class="flex flex-col text-center">
        <input type="text" placeholder="Spell Save DC" class="border-2 border-black rounded-md p-1 m-1 h-15" />
        spell attack bonus
      </label>
    </div>
  </div>

  <div class="grid grid-cols-3 gap-7 justify-center w-full"> <!-- spells known, spell slots -->
    <div class="w-full col-start-1 ">
      <CantripsPart />
      <LevelOneSpellsPart/>
      <LevelTwoSpellsPart/>
    </div>
    <div class="w-full col-start-2 ">
      <LevelThreeSpellsPart/>
      <LevelFourSpellsPart/>
      <LevelFiveSpellsPart/>
    </div >
    <div class="w-full ol-start-3">
      <LevelSixSpellsPart/>
      <LevelSevenSpellsPart/>
      <LevelEightSpellsPart/>
      <LevelNineSpellsPart/>
    </div>
  </div>

</template>

<style scoped>

</style>
