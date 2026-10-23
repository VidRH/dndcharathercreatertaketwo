<script setup>

import { ref, onMounted } from 'vue'
import { fetchAllOptionsTopPart } from '../modules/useClassRaceAlignApi.js'
import { selectClass } from '../modules/useSelectedClass.js'
import { selectRace } from '../modules/useSelectedRace.js'
import { selectBackground } from '../modules/useSelectedBackground.js'
import { level, experience } from '../modules/useLevelState.js'
import { setLevel, levelUp, canLevelUp, nextLevelXp, onClassChosen } from '../modules/useLevel.js'
import { loadClassSpells } from '../modules/useSpells.js'
import { characterName } from '../modules/useCharacterInfo.js'

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

// Runs when you pick a class in the dropdown
async function onClassChange(event) {
  try {
    await selectClass(event.target.value) // class popup: skills + gear
    await loadClassSpells() // the spells this class can learn, for the spell page
    await onClassChosen() // level popup: fighting style etc. for every level you already are
  } catch (err) {
    error.value = err.message
    console.error('Error selecting class:', err) //dont ship its just for debugging
  }
}

// Runs when you pick a race in the dropdown
async function onRaceChange(event) {
  try {
    await selectRace(event.target.value)
  } catch (err) {
    error.value = err.message
    console.error('Error selecting race:', err) //dont ship its just for debugging
  }
}

// Runs when you pick a background in the dropdown
async function onBackgroundChange(event) {
  try {
    await selectBackground(event.target.value)
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
  <Main>
    <div> <!-- top part of the charather maker includes: name, class, race,  , xp ,background, alignment --->
      <div class="flex justify-center items-center">
          <div>
            <p>Character Name</p>
            <input type="text" v-model="characterName" placeholder="Name" class="border-2 border-black rounded-md p-1 m-1 h-10" /> <!-- name input --->
          </div>
          <div class="grid grid-cols-3 grid-rows-2 justify-center items-center">


            <div class="flex justify-center items-center"> <!-- class select has to call in classes from api and populate the options plus lvl for good measure-->
              <div>
                <P>Class</P>    <!-- class select has to call in classes from api and populate the options--->
                <select @change="onClassChange" class="border-2 border-black rounded-md p-1 m-1 w-48 h-10">
                  <option value="" disabled selected>Select Class</option>
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
              <P>Background</P>
              <select @change="onBackgroundChange" class="border-2 border-black rounded-md p-1 m-1 w-60 h-10">
                <option value="" disabled selected>Select Background</option>
                <option v-for="background in backgrounds" :key="background.index" :value="background.index">
                  {{ background.name }}
                </option>
              </select>
            </div>


            <div>             <!-- player name input, or player account name will be put here -->
              <p>Player Name</p>
              <input type="text" placeholder="Player Name" class="border-2 border-black rounded-md p-1 m-1 w-60 h-10" />
            </div>

            <div>             <!-- race select has to call in races from api and populate the options--->
              <p>Race</p>
              <select @change="onRaceChange" class="border-2 border-black rounded-md p-1 m-1 w-60 h-10">
                <option value="" disabled selected>Select Race</option>
                <option v-for="race in races" :key="race.index" :value="race.index">
                  {{ race.name }}
                </option>
              </select>
            </div>

            <div>              <!-- alignment select has to call in alignments from api and populate the options--->
              <p>Alignment</p>
              <select class="border-2 border-black rounded-md p-1 m-1 w-60 h-10">
                  <option value="" disabled selected>Select Alignment</option>
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
    </div>
  </Main>
</template>


<style>

</style>
