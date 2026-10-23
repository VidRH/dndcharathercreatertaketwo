<script setup>
import { ref } from 'vue'
import CharatherMakerTopPart from '../components/CharatherMaker/NameHeaderTopPart.vue'
import CharatherMakerLeftPart from '../components/CharatherMaker/AttributesLeftPart.vue'
import CharatherMakerMiddlePart from '../components/CharatherMaker/ArmorInventoryMiddlePart.vue'
import CharatherMakerRightPart from '../components/CharatherMaker/BackstoryRightPart.vue'
import ChoicePopup from '../components/CharatherMaker/ChoicePopup.vue'
import LevelUpPopup from '../components/CharatherMaker/LevelUpPopup.vue'
import BackgroundPage from '../components/CharatherMaker/backgroundpage/BackgroundPage.vue'
import SpellcastingPage from '../components/CharatherMaker/spellcastingpage/SpellcastingPage.vue'

// The three pages of the character sheet, like tabs in a folder
const pages = [
  { id: 'sheet', label: 'Character Sheet' },
  { id: 'background', label: 'Background' },
  { id: 'spells', label: 'Spells' },
]
const currentPage = ref('sheet')
</script>


<template>
  <main>
    <!-- tab buttons to switch page -->
    <nav class="flex justify-center gap-2.5 my-4">
      <button
        v-for="page in pages"
        :key="page.id"
        @click="currentPage = page.id"
        class="border-2 border-black rounded-md px-4 py-1 text-lg cursor-pointer"
        :class="currentPage === page.id ? 'bg-paperdarker font-bold' : 'opacity-60'"
      >
        {{ page.label }}
      </button>
    </nav>

    <!--
      v-show only HIDES a page (v-if would throw it away and rebuild it empty).
      So everything you typed is still there when you come back.
    -->
    <div v-show="currentPage === 'sheet'">
      <CharatherMakerTopPart class="w-80% my-7" /> <!--includes: name, class, race, level , xp ,background, alignment -->
      <div class="flex flex-rows justify-between flex-nonwrap  w-80%"> <!--grid for the left, middle and right parts-->
        <CharatherMakerLeftPart class="w-1/3 col-span-1 col-start-1 "/> <!-- includes: attributes, saving throws, profeciency bonus, inspiration, skills,  passive preception, other proficiencies -->
        <CharatherMakerMiddlePart class="w-1/3 col-span-1 col-start-2 "/> <!--includes: armor class, initiative, speed, hit points and hit dice, temporary hitpoints, death saves, attacks spellcasting,equipment, money-->
        <CharatherMakerRightPart class="w-1/3 col-span-1 col-start-3  "/> <!--personality traits, ideal, bond, flaw, features & traits-->
      </div>
    </div>

    <div v-show="currentPage === 'background'">
      <BackgroundPage /> <!-- includes: name, age, height, weight, eyes, skin, hair -->
    </div>

    <div v-show="currentPage === 'spells'">
      <SpellcastingPage /> <!-- includes: spellcasting class, spellcasting ability, spell save dc, spell attack bonus, spells known, spell slots -->
    </div>

    <!-- popups sit outside the pages so they work whichever page you're on -->
    <ChoicePopup /> <!-- only shows up while you're picking class/race/background options -->
    <LevelUpPopup /> <!-- only shows up when you gain a level -->
  </main>
</template>


<style>

</style>
