<script setup>
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <header>
    <div>
      <nav class="bg-dark text-white gap-5 flex min-h-12.5 items-center px-5 uppercase weight-bold text-xl">
        <RouterLink to="/" class="hover:text-blue ">Home</RouterLink>
        <RouterLink to="/LogIn" class="hover:text-blue ">Log In</RouterLink>
        <RouterLink to="/CharatherMaker" class="hover:text-blue ">Make your character</RouterLink>
      </nav>
    </div>
  </header>

  <RouterView />
</template>

<style scoped>
</style>
