<script setup>

import { ref, onMounted } from 'vue'
import { fetchAllOptionsTopPart } from '../modules/useClassRaceAlignApi.js'

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


</script>



<template>
  <Main>
    <div> <!-- top part of the charather maker includes: name, class, race,  , xp ,background, alignment --->
      <div class="flex justify-center items-center">
          <div>
            <p>Character Name</p>
            <input type="text" placeholder="Name" class="border-2 border-black rounded-md p-1 m-1 h-10" /> <!-- name input --->
          </div>
          <div class="grid grid-cols-3 grid-rows-2 justify-center items-center">


            <div class="flex justify-center items-center"> <!-- class select has to call in classes from api and populate the options plus lvl for good measure-->
              <div>
                <P>Class</P>    <!-- class select has to call in classes from api and populate the options--->
                <select class="border-2 border-black rounded-md p-1 m-1 w-48 h-10">
                  <option value="" disabled selected>Select Class</option>
                  <option v-for="item in classes" :key="item.index" :value="item.index">
                    {{ item.name }}
                  </option>
                </select>
              </div>
              <div>              <!-- level input -->
                <P>lvl</P>
                <input type="number" placeholder="1" class="border-2 border-black rounded-md p-1 m-1 w-10 h-10" /> <!-- level input --->
              </div>
            </div>

            <div>             <!-- background select has to call in backgrounds from api and populate the options--->
              <P>Background</P>
              <select class="border-2 border-black rounded-md p-1 m-1 w-60 h-10">
                <option value="" disabled selected>Select Background</option>
                <option v-for="item in backgrounds" :key="item.index" :value="item.index">
                  {{ item.name }}
                </option>
              </select>
            </div>


            <div>             <!-- player name input, or player account name will be put here -->
              <p>Player Name</p>
              <input type="text" placeholder="Player Name" class="border-2 border-black rounded-md p-1 m-1 w-60 h-10" />
            </div>

            <div>             <!-- race select has to call in races from api and populate the options--->
              <p>Race</p>
              <select class="border-2 border-black rounded-md p-1 m-1 w-60 h-10">
                <option value="" disabled selected>Select Race</option>
                <option v-for="item in races" :key="item.index" :value="item.index">
                  {{ item.name }}
                </option>
              </select>
            </div>

            <div>              <!-- alignment select has to call in alignments from api and populate the options--->
              <p>Alignment</p>
              <select class="border-2 border-black rounded-md p-1 m-1 w-60 h-10">
                  <option value="" disabled selected>Select Alignment</option>
                  <option v-for="item in alignments" :key="item.index" :value="item.index">
                    {{ item.name }}
                  </option>
            </select>
            </div>

            <div>              <!-- xp input -->
              <p>Experience Points</p>
              <Input type="number" placeholder="xp" class="border-2 border-black rounded-md p-1 m-1 w-60 h-10" />
            </div>
          </div>
      </div>
    </div>
  </Main>
</template>


<style>

</style>
