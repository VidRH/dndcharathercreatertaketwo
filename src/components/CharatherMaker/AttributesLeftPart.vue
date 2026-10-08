<script setup>
import { ref, onMounted } from 'vue'
import { fetchAllOptionsLeftPart } from '../modules/useAbilityScoresApi.js'

const abilityScores = ref([])
// const savingThrows = ref([])
const skills = ref([])

const loading = ref(true)
const error = ref(null)

// The component starts the fetch when it mounts
onMounted(async () => {
  try {
    const data = await  fetchAllOptionsLeftPart()


    abilityScores.value = data.abilityScores
    skills.value = data.skills
    // savingThrows.value = data.alignments


    console.log('skills:', skills.value)


  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
})


// const abilityInputCalc = () => {
//   const abilityScoreInput = document.getElementById('abilityScoreInput').value;
//   console.log(abilityScoreInput);
// }

// document.getElementById("abilityScoreInput").oninput = abilityInputCalc;

</script>

<template>
  <Main>
    <div class="grid grid-cols-6 gap-4 w-full">
      <div class="col-span-1 col-start-2">
        <div v-for="ability in abilityScores" :key="ability.index" class="flex-col justify-center items-center gap-2.5 border-2 ">
          <p class=" w-full h-18 text-2xl text-center border-2">+{{ }}</p>
          <input  :placeholder="ability.name" type="number" id="abilityScoreInput" class="flex justify-center items-center text-center border-x-2 w-full "/>
        </div>
      </div>
      <div class="col-span-3 col-start-4 gap-5"> <!-- gap doesnt work so im going to peel my skin off now, here we go AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA-->
        <!---->
        <div class="flex-col justify-between items-center gap-2.5">
          <div class="flex  items-center gap-2.5">
            <input type="checkbox" class="w-10 h-10"/>
            <label>Inspiration</label>
          </div>
          <div class="flex  items-center gap-2.5">
            <input type="number" class=" w-10 h-10 text-2xl text-center border-2" placeholder="+2"/>
            <label>Proficiency Bonus </label>
          </div>
        </div>
        <!---->


        <div class="gap-2.5 mt-12">
          <div v-for="ability in abilityScores" :key="ability.index" class="flex justify-between items-center gap-2.5">
            <div class="flex justify-between items-center gap-2.5">
              <!-- v-for here for each saving throw -->
              <input type="checkbox" class="w-10 h-10 text-2xl text-center"/>
              <!-- something here for displaying saving throw number stuff -->
              <label>{{ ability.name }}</label>
              <!-- This is a comment -->
            </div>
          </div>
          <label>Saving throws</label>
        </div>
      </div>


    </div>
    <div>    <!--passive perception, other proficiencies & languages-->
      <div class="flex justify-center-safe items-center gap-10">
        <input type="number" class=" w-10 h-10 text-2xl text-center" />
        <label>Passive Perception</label>
      </div>
      <div class="flex flex-col justify-center items-center gap-2.5">
        <textarea class="w-full h-40 border-2"></textarea>
        <label>Other Proficiencies & Languages</label>
      </div>
    </div>
  </Main>
</template>

<style scoped></style>
