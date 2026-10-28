<script setup>
import { computed } from 'vue'
import { abilityModifier, formatModifier } from '@/components/modules/useEncounterMath.js'
import { challengeText } from '@/components/modules/useMonsterApi.js'

// A monster's stat block, laid out like in the Monster Manual.
// statBlock = what fetchMonster() made. The name can be missing (hidden from players).
const props = defineProps({
  statBlock: { type: Object, required: true },
})

const typeLine = computed(() => {
  const { size, type, subtype, alignment } = props.statBlock
  const kind = subtype ? `${type} (${subtype})` : type
  return [`${size} ${kind}`.trim(), alignment].filter(Boolean).join(', ')
})

const armorClassText = computed(() =>
  props.statBlock.armorClass.map((armorClass) => (armorClass.note ? `${armorClass.value} (${armorClass.note})` : armorClass.value)).join(', '),
)

const hitPointsText = computed(() => {
  const { hitPoints, hitDice } = props.statBlock
  return hitDice ? `${hitPoints} (${hitDice})` : `${hitPoints}`
})

// e.g. 'CON +6, WIS +7'
function bonusList(list) {
  return list.map((entry) => `${entry.name} ${formatModifier(entry.value)}`).join(', ')
}

// The lines that are only shown when the monster has them
const extraLines = computed(() => {
  const stats = props.statBlock
  return [
    ['Saving Throws', bonusList(stats.savingThrows)],
    ['Skills', bonusList(stats.skills)],
    ['Damage Vulnerabilities', stats.damageVulnerabilities.join(', ')],
    ['Damage Resistances', stats.damageResistances.join(', ')],
    ['Damage Immunities', stats.damageImmunities.join(', ')],
    ['Condition Immunities', stats.conditionImmunities.join(', ')],
    ['Senses', stats.senses],
    ['Languages', stats.languages],
  ].filter(([, text]) => text)
})

// The sections of abilities and actions, empty ones left out
const sections = computed(() =>
  [
    { title: '', entries: props.statBlock.specialAbilities },
    { title: 'Actions', entries: props.statBlock.actions },
    { title: 'Reactions', entries: props.statBlock.reactions },
    { title: 'Legendary Actions', entries: props.statBlock.legendaryActions },
  ].filter((section) => section.entries.length > 0),
)
</script>

<template>
  <article class="bg-paperlighter border-2 border-black rounded-md p-3 flex flex-col gap-2 text-sm">
    <div>
      <p v-if="statBlock.name" class="text-xl font-bold">{{ statBlock.name }}</p>
      <p class="italic">{{ typeLine }}</p>
    </div>

    <div class="border-t-2 border-red pt-1">
      <p><span class="font-bold">Armor Class</span> {{ armorClassText }}</p>
      <p><span class="font-bold">Hit Points</span> {{ hitPointsText }}</p>
      <p><span class="font-bold">Speed</span> {{ statBlock.speed }}</p>
    </div>

    <!-- the six scores, each with its modifier -->
    <div class="border-t-2 border-red pt-1 grid grid-cols-3 sm:grid-cols-6 gap-1 text-center">
      <div v-for="(score, ability) in statBlock.abilities" :key="ability">
        <p class="font-bold">{{ ability }}</p>
        <p>{{ score }} ({{ formatModifier(abilityModifier(score)) }})</p>
      </div>
    </div>

    <div class="border-t-2 border-red pt-1">
      <p v-for="[label, text] in extraLines" :key="label"><span class="font-bold">{{ label }}</span> {{ text }}</p>
      <p>
        <span class="font-bold">Challenge</span> {{ challengeText(statBlock.challengeRating) }} ({{ statBlock.xp.toLocaleString() }} XP)
        <span class="font-bold ml-2">Proficiency Bonus</span> {{ formatModifier(statBlock.proficiencyBonus) }}
      </p>
    </div>

    <section v-for="section in sections" :key="section.title" class="border-t-2 border-red pt-1 flex flex-col gap-1">
      <h3 v-if="section.title" class="text-lg border-b border-red">{{ section.title }}</h3>
      <!-- whitespace-pre-line keeps the line breaks the API puts in long texts -->
      <p v-for="(entry, index) in section.entries" :key="index" class="whitespace-pre-line">
        <span class="font-bold italic">{{ entry.name }}.</span> {{ entry.desc }}
      </p>
    </section>

    <p v-if="statBlock.description" class="border-t-2 border-red pt-1 whitespace-pre-line">{{ statBlock.description }}</p>
  </article>
</template>
