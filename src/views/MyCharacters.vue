<script setup>
import { RouterLink } from 'vue-router'

// Placeholder for now: the list of saved characters comes in step 6
</script>

<template>
  <main class="flex flex-col gap-4 max-w-3xl mx-auto p-4">
    <h1 class="text-2xl uppercase">My Characters</h1>
    <RouterLink to="/CharatherMaker" class="border p-2 self-start">New Character</RouterLink>
  </main>
</template>
