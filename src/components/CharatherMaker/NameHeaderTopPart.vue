<script setup>

import { ref, computed, onMounted } from 'vue'
import { fetchAllOptionsTopPart } from '../modules/useClassRaceAlignApi.js'
import { selectedClass, selectClass } from '../modules/useSelectedClass.js'
import { selectedRace, selectRace } from '../modules/useSelectedRace.js'
import { selectedBackground, selectBackground } from '../modules/useSelectedBackground.js'
import { level, experience } from '../modules/useLevelState.js'
import { setLevel, levelUp, canLevelUp, nextLevelXp, onClassChosen } from '../modules/useLevel.js'
import { characterName, playerName, alignment } from '../modules/useCharacterInfo.js'
import { loadClassSpells } from '../modules/useSpells.js'

const classes = ref([])
const races = ref([])
const alignments = ref([])
const backgrounds = ref([])

const loading = ref(true)
const error = ref(null)

// The component starts the fetch when it mounts
onMounted(async () => {
  try {
    const data = await fetchAllOptionsTopPart()


    classes.value = data.classes
    races.value = data.races
    alignments.value = data.alignments
    backgrounds.value = data.backgrounds


  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
})

// What the class/race/background dropdowns show. A computed with a get AND a set:
//   get: show whatever is in the shared box (so a loaded character shows up in the dropdown)
//   set: you picked something -> run the same code as before (popups and all)
// v-model on a <select> also puts the right option back when the options arrive from the API late.
const classIndex = computed({
  get: () => selectedClass.value?.index ?? '',
  set: (index) => onClassChange(index),
})
const raceIndex = computed({
  get: () => selectedRace.value?.index ?? '',
  set: (index) => onRaceChange(index),
})
const backgroundIndex = computed({
  get: () => selectedBackground.value?.index ?? '',
  set: (index) => onBackgroundChange(index),
})

// Runs when you pick a class in the dropdown
async function onClassChange(index) {
  try {
    await selectClass(index) // class popup: skills + gear
    await loadClassSpells() // the spells this class can learn, for the spell page
    await onClassChosen() // level popup: fighting style etc. for every level you already are
  } catch (err) {
    error.value = err.message
    console.error('Error selecting class:', err) //dont ship its just for debugging
  }
}

// Runs when you pick a race in the dropdown
async function onRaceChange(index) {
  try {
    await selectRace(index)
  } catch (err) {
    error.value = err.message
    console.error('Error selecting race:', err) //dont ship its just for debugging
  }
}

// Runs when you pick a background in the dropdown
async function onBackgroundChange(index) {
  try {
    await selectBackground(index)
  } catch (err) {
    error.value = err.message
    console.error('Error selecting background:', err) //dont ship its just for debugging
  }
}

// Runs when you type a level. setLevel keeps it between 1 and 20,
// so we put the real level back in the box in case you typed something like 25.
async function onLevelChange(event) {
  try {
    const leveling = setLevel(Number(event.target.value))
    event.target.value = level.value
    await leveling
  } catch (err) {
    error.value = err.message
  }
}

async function onLevelUpClick() {
  try {
    await levelUp()
  } catch (err) {
    error.value = err.message
  }
}

</script>



<template>
  <main >
      <div class="lg:flex justify-center items-center"><!-- top part of the charather maker includes: name, class, race,  , xp ,background, alignment --->
        <div class>
          <p>Character Name</p>
          <input type="text" v-model="characterName" placeholder="Name" class="border-2 border-black rounded-md p-1 m-1 h-10" /> <!-- name input --->
        </div>
        <div class="grid lg:grid-cols-3 sm:grid-cols-2 grid-cols-1 justify-center items-center ">


          <div class="flex items-center"> <!-- class select has to call in classes from api and populate the options plus lvl for good measure-->
            <div>
              <p>Class</p>    <!-- class select has to call in classes from api and populate the options--->
              <select v-model="classIndex" class="border-2 border-black rounded-md p-1 m-1 w-48 h-10">
                <option value="" disabled>Select Class</option>
                <option v-for="cls in classes" :key="cls.index" :value="cls.index">
                  {{ cls.name }}
                </option>
              </select>
            </div>
            <div>              <!-- level input -->
              <P>lvl</P>
              <input type="number" min="1" max="20" :value="level" @change="onLevelChange" class="border-2 border-black rounded-md p-1 m-1 w-14 h-10" /> <!-- level input --->
             </div>
           </div>

          <div>             <!-- background select has to call in backgrounds from api and populate the options--->
            <p>Background</p>
            <select v-model="backgroundIndex" class="border-2 border-black rounded-md p-1 m-1 w-60 h-10">
              <option value="" disabled>Select Background</option>
              <option v-for="background in backgrounds" :key="background.index" :value="background.index">
                {{ background.name }}
              </option>
            </select>
          </div>


          <div>             <!-- player name input, or player account name will be put here -->
            <p>Player Name</p>
            <input v-model="playerName" type="text" placeholder="Player Name" class="border-2 border-black rounded-md p-1 m-1 w-60 h-10" />
          </div>

          <div>             <!-- race select has to call in races from api and populate the options--->
            <p>Race</p>
            <select v-model="raceIndex" class="border-2 border-black rounded-md p-1 m-1 w-60 h-10">
              <option value="" disabled>Select Race</option>
              <option v-for="race in races" :key="race.index" :value="race.index">
                {{ race.name }}
              </option>
            </select>
          </div>

          <div>              <!-- alignment select has to call in alignments from api and populate the options--->
            <p>Alignment</p>
            <select v-model="alignment" class="border-2 border-black rounded-md p-1 m-1 w-60 h-10">
                <option value="" disabled>Select Alignment</option>
                <option v-for="alignment in alignments" :key="alignment.index" :value="alignment.index">
                  {{ alignment.name }}
                </option>
            </select>
          </div>

          <div>              <!-- xp input -->
            <p>Experience Points</p>
            <div class="flex items-center">
              <input type="number" min="0" v-model.number="experience" placeholder="xp" class="border-2 border-black rounded-md p-1 m-1 w-40 h-10" />
              <!-- only shows when you have enough XP for the next level -->
              <button v-if="canLevelUp" @click="onLevelUpClick" class="border-2 border-black rounded-md px-2 h-10 bg-black text-white">⬆ Level up!</button>
            </div>
            <p v-if="nextLevelXp !== null" class="text-xs text-gray-500">next level at {{ nextLevelXp }} XP</p>
          </div>
        </div>
      </div>
  </main>
</template>


<style>

</style>
