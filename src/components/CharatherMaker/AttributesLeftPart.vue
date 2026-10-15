<script setup>
import { ref, computed, onMounted } from 'vue'
import { fetchAllOptionsLeftPart } from '../modules/useAbilityScoresApi.js'
import { isSavingThrow, otherProficiencies } from '../modules/useSelectedClass.js'
import { raceBonus, raceLanguages } from '../modules/useSelectedRace.js'
import { backgroundProficiencies, hasBackgroundSkill } from '../modules/useSelectedBackground.js'

// Glue the class, race and background text together for the big textarea (skip empty ones)
const proficienciesAndLanguages = computed(() =>
  [otherProficiencies.value, backgroundProficiencies.value, raceLanguages.value]
    .filter((text) => text !== '')
    .join('\n'),
)

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

</script>

<template>
  <Main>
    <div class="grid grid-cols-7 gap-4 w-full">
      <div class="col-span-1 col-start-2">
        <div v-for="ability in abilityScores" :key="ability.index" class="flex-col justify-center items-center gap-2.5 border-2 ">
          <p class=" w-full h-18 text-2xl text-center border-2">+{{ }}</p>
          <input  :placeholder="ability.name" type="number" id="abilityScoreInput" class="flex justify-center items-center text-center border-x-2 w-full "/>
          <p v-if="raceBonus(ability.index) > 0" class="text-lg text-center text-gray-500 border-x-2 border-t-2">race +{{ raceBonus(ability.index) }}</p>
        </div>
      </div>
      <div class="col-span-3 col-start-4"> <!-- gap doesnt work so im going to peel my skin off now, here we go AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA-->
        <!---->
        <div class="flex-col justify-between items-center">
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
              <input type="checkbox" :checked="isSavingThrow(ability.index)" class="w-10 h-10 text-2xl text-center"/>

              <input type="number" class="w-10 h-10 text-2xl text-center border-2" placeholder="0"/>
              <!-- something here for displaying saving throw number stuff -->
              <label>{{ ability.name }}</label>
            </div>
          </div>
          <label>Saving throws</label>
        </div>

        <!-- skills  -->
        <div class="gap-2.5 mt-12">
          <div v-for="skill in skills" :key="skill.index" class="flex justify-between items-center gap-2.5">
            <div class="flex justify-between items-center gap-2.5">
              <!-- v-for here for each skill -->
              <input type="checkbox" :checked="hasBackgroundSkill(skill.index)" class="w-10 h-10 text-2xl text-center"/>

              <input type="number" class="w-10 h-10 text-2xl text-center border-2" placeholder="0"/>
              <!-- something here for displaying skill number stuff -->
              <label>{{ skill.name }}</label>
            </div>
          </div>
          <label>Skills</label>
        </div>
      </div>


    </div>
    <div>    <!--passive perception, other proficiencies & languages-->
      <div class="flex justify-center-safe items-center gap-10">
        <input type="number" class=" w-10 h-10 text-2xl text-center" />
        <label>Passive Perception</label>
      </div>
      <div class="flex flex-col justify-center items-center gap-2.5">
        <textarea :value="proficienciesAndLanguages" class="w-full min-h-80 border-2 text-lg"></textarea>
        <label>Other Proficiencies & Languages</label>
      </div>
    </div>
  </Main>
</template>

<style scoped></style>
