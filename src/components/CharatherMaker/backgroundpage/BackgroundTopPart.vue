<script setup>
import { characterName, age, height, weight, eyes, hair, skin } from '../../modules/useCharacterInfo.js'
</script>

<template>
  <div class="flex  gap-2.5 justify-center items-center">
    <div>
      <p>Character Name</p>
      <input type="text" v-model="characterName" placeholder=" Charather Name" class="border-2 border-black rounded-md p-1 m-1 h-10" /> <!-- name input --->
    </div>
    <div class="">
      <div class="flex">
        <label class="flex flex-col">
          Age
          <input v-model="age" placeholder="Age" class="border-2 border-black rounded-md p-1 m-1 w-60 h-10">
        </label>
        <label class="flex flex-col">
          height
          <input v-model="height" placeholder="Height" class="border-2 border-black rounded-md p-1 m-1 w-60 h-10">
        </label>
        <label class="flex flex-col">
          Weight
          <input v-model="weight" placeholder="Weight" class="border-2 border-black rounded-md p-1 m-1 w-60 h-10">
        </label>
      </div>
      <div class="flex">
        <label class="flex flex-col">
          Eyes
          <input v-model="eyes" placeholder="Eyes" class="border-2 border-black rounded-md p-1 m-1 w-60 h-10">
        </label>
        <label class="flex flex-col">
          Hair
          <input v-model="hair" placeholder="Hair" class="border-2 border-black rounded-md p-1 m-1 w-60 h-10">
        </label>
        <label class="flex flex-col">
          Skin
          <input v-model="skin" placeholder="Skin" class="border-2 border-black rounded-md p-1 m-1 w-60 h-10">
        </label>
      </div>

    </div>

  </div>
</template>

<style scoped> </style>
