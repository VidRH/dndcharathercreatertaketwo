<script setup>
import { ref, computed, onMounted } from 'vue'
import { fetchAllOptionsLeftPart } from '../modules/useAbilityScoresApi.js'
import { otherProficiencies } from '../modules/useSelectedClass.js'
import { raceBonus, raceLanguages, raceProficiencies } from '../modules/useSelectedRace.js'
import { backgroundProficiencies } from '../modules/useSelectedBackground.js'
import {
  ABILITIES,
  ABILITY_FULL_NAMES,
  abilityInputs,
  abilityMethod,
  chooseMethod,
  resetMethod,
  rollD20,
  POINT_BUDGET,
  POINT_COST,
  pointsLeft,
  costOfNextPoint,
  canIncrease,
  canDecrease,
  increase,
  decrease,
  abilityTotal,
  abilityModifier,
  formatModifier,
} from '../modules/useAbilityScores.js'
import { proficiencyBonus, asiBonus } from '../modules/useLevelState.js'
import {
  skillAbilityLabel,
  isSkillProficient,
  setSkillProficient,
  isSaveProficient,
  setSaveProficient,
  hasExpertise,
  skillBonus,
  saveBonus,
  passivePerception,
} from '../modules/useSkills.js'
import { inspiration } from '../modules/useCharacterInfo.js'

// Glue the class, race and background text together for the big textarea (skip empty ones)
const proficienciesAndLanguages = computed(() =>
  [otherProficiencies.value, backgroundProficiencies.value, raceProficiencies.value, raceLanguages.value]
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

    // The API sends them A-Z (CHA, CON, DEX...), so put them in character sheet order (STR, DEX, CON...)
    abilityScores.value = data.abilityScores.sort(
      (a, b) => ABILITIES.indexOf(a.index) - ABILITIES.indexOf(b.index),
    )
    skills.value = data.skills

  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
})

</script>

<template>
  <main>
    <div class="grid grid-cols-7 gap-4 w-full">
      <div class="col-span-3 col-start-1 m-6 relative min-h-96">

        <!-- top of the column: points left + button to bring the cover back -->
        <div v-if="abilityMethod" class="flex flex-col items-center gap-1 mb-2 text-center">
          <div v-if="abilityMethod === 'pointbuy'">
            <p class="text-xs">Points left</p>
            <p class="text-2xl" :class="{ 'text-red-700': pointsLeft === 0 }">{{ pointsLeft }}/{{ POINT_BUDGET }}</p>
          </div>
          <button @click="resetMethod" class="border-2 border-black rounded-md px-1 text-xs w-full">change method</button>
        </div>

        <div v-for="ability in abilityScores" :key="ability.index" class="flex-col justify-center items-center gap-2.5 border-2 ">
          <!-- name of the ability, e.g. "Strength (STR)" -->
          <label :for="`ability-${ability.index}`" class="block w-full text-center font-bold border-x-2 border-t-2">
            {{ ABILITY_FULL_NAMES[ability.index] }} <span class="text-xs text-gray-500">({{ ability.name }})</span>
          </label>
          <p class=" w-full h-18 text-2xl text-center border-2">{{ formatModifier(abilityModifier(ability.index)) }}</p>
          <input v-model="abilityInputs[ability.index]" :readonly="abilityMethod === 'pointbuy'" :placeholder="ability.name" type="number" :id="`ability-${ability.index}`" class="flex justify-center items-center text-center border-x-2 w-full "/>

          <!-- rolling: one button per ability -->
          <button v-if="abilityMethod === 'roll'" @click="rollD20(ability.index)" class="w-full border-x-2 border-t-2 text-sm">Roll a d20</button>

          <!-- point buy: - and + buttons, and what this score costs -->
          <div v-if="abilityMethod === 'pointbuy'" class="border-x-2 border-t-2 text-m text-center">
            <div class="flex justify-between">
              <button @click="decrease(ability.index)" :disabled="!canDecrease(ability.index)" class="px-2 text-4xl disabled:opacity-30">−</button>
              <button @click="increase(ability.index)" :disabled="!canIncrease(ability.index)" class="px-2 text-4xl disabled:opacity-30">+</button>
            </div>
            <p>costs {{ POINT_COST[abilityInputs[ability.index]] }} pts</p>
            <p>{{ costOfNextPoint(ability.index) === null ? 'max is 15' : `next +1: ${costOfNextPoint(ability.index)} pts` }}</p>
          </div>

          <!-- bonuses go on top and never cost points -->
          <p v-if="raceBonus(ability.index) > 0" class="text-lg text-center text-gray-500 border-x-2 border-t-2">race +{{ raceBonus(ability.index) }}</p>
          <p v-if="asiBonus(ability.index) > 0" class="text-lg text-center text-gray-500 border-x-2 border-t-2">level +{{ asiBonus(ability.index) }}</p>
          <!-- always shown: your score + all bonuses (this is the number the modifier above comes from) -->
          <p class="text-lg font-bold bg-paperdarker text-center border-x-2 border-t-2">total {{ abilityTotal(ability.index) }}</p>
        </div>

        <!-- point buy: the cost table from the Player's Handbook -->
        <div v-if="abilityMethod === 'pointbuy'" class="mt-2 text-lg text-center">
          <p class="font-bold">Cost</p>
          <p v-for="(cost, score) in POINT_COST" :key="score">{{ score }} = {{ cost }} pts</p>
        </div>

        <!-- the cover: shows until you pick a method -->
        <div v-if="!abilityMethod" class="absolute inset-0 z-10 bg-paperdarker border-2 border-black rounded-md flex flex-col justify-center items-center gap-2.5 p-1 text-center">
          <p class="font-bold text-lg">How do you make your scores?</p>
          <button @click="chooseMethod('roll')" class="border-2 border-black rounded-md px-1 w-full">Dice Roll</button>
          <button @click="chooseMethod('pointbuy')" class="border-2 border-black rounded-md px-1 w-full">27 Point Buy</button>
        </div>
      </div>
      <div class="col-span-3 col-start-4"> <!-- gap doesnt work so im going to peel my skin off now, here we go AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA-->
        <!---->
        <div class="flex-col justify-between items-center">
          <div class="flex  items-center gap-2.5">
            <input v-model="inspiration" type="checkbox" class="w-10 h-10"/>
            <label>Inspiration</label>
          </div>
          <div class="flex  items-center gap-2.5">
            <!-- goes up by itself as you level: +2, +3 at level 5, +4 at level 9... -->
            <input type="text" readonly :value="formatModifier(proficiencyBonus)" class=" w-10 h-10 text-2xl text-center border-2"/>
            <label>Proficiency Bonus </label>
          </div>
        </div>
        <!---->


        <div class="gap-2.5 mt-12"> <!-- saving throws -->
          <div v-for="ability in abilityScores" :key="ability.index" id="saving-throws" class="flex justify-between items-center gap-2.5">
            <div class="flex justify-between items-center gap-2.5">
              <!-- ticked = proficient (your class ticks some, you can tick/untick yourself) -->
              <input
                type="checkbox"
                :id="`save-${ability.index}`"
                :checked="isSaveProficient(ability.index)"
                @change="setSaveProficient(ability.index, $event.target.checked)"
                class="w-10 h-10 text-2xl text-center"
              />
              <input type="text" readonly :value="formatModifier(saveBonus(ability.index))" class="w-10 h-10 text-2xl text-center border-2"/>
              <label :for="`save-${ability.index}`">{{ ABILITY_FULL_NAMES[ability.index] }}</label>
            </div>
          </div>
          <label>Saving throws</label>
        </div>


        <div class="gap-2.5 mt-12"> <!-- skills  -->
          <div v-for="skill in skills" :key="skill.index" id="skills" class="flex justify-between items-center gap-2.5">
            <div class="flex justify-between items-center gap-2.5">
              <!-- ticked = proficient (class/background/race tick some, you can tick/untick yourself) -->
              <input
                type="checkbox"
                :id="`skill-${skill.index}`"
                :checked="isSkillProficient(skill.index)"
                @change="setSkillProficient(skill.index, $event.target.checked)"
                class="w-10 h-10 text-2xl text-center"
              />
              <input type="text" readonly :value="formatModifier(skillBonus(skill.index))" class="w-10 h-10 text-2xl text-center border-2"/>
              <label :for="`skill-${skill.index}`" class="text-nowrap">
                {{ skill.name }} <span class="text-sm text-gray-500">({{ skillAbilityLabel(skill.index) }})</span>
                <span v-if="hasExpertise(skill.index) && isSkillProficient(skill.index)" class="text-sm" title="Expertise: proficiency bonus counts twice">★</span>
              </label>
            </div>
          </div>
          <label>Skills</label>
        </div>
      </div>


    </div>
    <div>    <!--passive perception, other proficiencies & languages-->
      <div class="flex justify-center-safe items-center gap-10">
        <input type="number" id="passivePerception" readonly :value="passivePerception()" class=" w-10 h-10 text-2xl text-center" />
        <label for="passivePerception">Passive Perception</label>
      </div>
      <div class="flex flex-col justify-center items-center gap-2.5">
        <textarea :value="proficienciesAndLanguages" class="w-full min-h-80 border-2 text-lg"></textarea>
        <label>Other Proficiencies & Languages</label>
      </div>
    </div>
  </main>
</template>

<style scoped></style>
