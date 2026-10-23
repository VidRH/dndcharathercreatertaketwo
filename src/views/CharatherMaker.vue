<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { saveCharacter } from '../components/modules/useSavedCharacters.js'
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

const route = useRoute()
const router = useRouter()

// '' = nothing yet, 'saving', 'saved', or an error message
const saveStatus = ref('')

async function onSave() {
  saveStatus.value = 'saving'
  try {
    const id = await saveCharacter(route.params.id)
    // First save: put the new id in the URL, so the next save updates this character
    if (!route.params.id) await router.replace(`/CharatherMaker/${id}`)
    saveStatus.value = 'saved'
  } catch (err) {
    saveStatus.value = err.message
    console.error('Error saving character:', err) //dont ship its just for debugging
  }
}
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

      <button
        @click="onSave"
        :disabled="saveStatus === 'saving'"
        class="border-2 border-black rounded-md px-4 py-1 text-lg cursor-pointer bg-black text-white disabled:opacity-50"
      >
        {{ saveStatus === 'saving' ? 'Saving...' : 'Save' }}
      </button>
      <p v-if="saveStatus === 'saved'" class="self-center text-green-700">Saved!</p>
      <p v-else-if="saveStatus !== '' && saveStatus !== 'saving'" class="self-center text-red-600">{{ saveStatus }}</p>
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
