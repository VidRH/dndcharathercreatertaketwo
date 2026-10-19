<script setup>
import CharatherMakerTopPart from '../components/CharatherMaker/NameHeaderTopPart.vue'
import CharatherMakerLeftPart from '../components/CharatherMaker/AttributesLeftPart.vue'
import CharatherMakerMiddlePart from '../components/CharatherMaker/ArmorInventoryMiddlePart.vue'
import CharatherMakerRightPart from '../components/CharatherMaker/BackstoryRightPart.vue'
import ChoicePopup from '../components/CharatherMaker/ChoicePopup.vue'
import LevelUpPopup from '../components/CharatherMaker/LevelUpPopup.vue'

</script>


<template>
  <Main>
    <CharatherMakerTopPart class="w-80% my-7" /> <!--includes: name, class, race, level , xp ,background, alignment -->
    <div class="flex flex-rows justify-between flex-nonwrap  w-80%"> <!--grid for the left, middle and right parts-->
      <CharatherMakerLeftPart class="w-1/3 col-span-1 col-start-1 "/> <!-- includes: attributes, saving throws, profeciency bonus, inspiration, skills,  passive preception, other proficiencies -->
      <CharatherMakerMiddlePart class="w-1/3 col-span-1 col-start-2 "/> <!--includes: armor class, initiative, speed, hit points and hit dice, temporary hitpoints, death saves, attacks spellcasting,equipment, money-->
      <CharatherMakerRightPart class="w-1/3 col-span-1 col-start-3  "/> <!--personality traits, ideal, bond, flaw, features & traits-->
    </div>
    <ChoicePopup /> <!-- only shows up while you're picking class/race/background options -->
    <LevelUpPopup /> <!-- only shows up when you gain a level -->
  </Main>
</template>


<style>

</style>
