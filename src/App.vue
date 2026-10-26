<script setup>
import { RouterLink, RouterView, useRouter } from 'vue-router'
import { currentUser, logOut } from '@/components/modules/useAuth.js'
import { currentProfile, isDM } from '@/components/modules/useProfile.js'

const router = useRouter()

async function handleLogOut() {
  await logOut()
  router.push('/LogIn')
}
</script>

<template>
  <header>
    <div>
      <!-- flex-wrap: the links go onto a second line on small screens instead of off the edge -->
      <nav class="bg-dark text-white gap-x-5 gap-y-1 flex flex-wrap min-h-12.5 items-center px-5 py-2 uppercase weight-bold text-xl">
        <RouterLink to="/" class="hover:text-blue ">Home</RouterLink>
        <RouterLink v-if="currentUser" to="/MyCharacters" class="hover:text-blue ">My Characters</RouterLink>
        <router-link v-if="currentUser && isDM" to="/DungeonMaster" class="hover:text-blue ">Dungeon Master</router-link>
        <div v-if="!currentUser" class="ml-auto flex items-center gap-5">
          <RouterLink to="/LogIn" class="hover:text-blue ">Log In</RouterLink>
          <RouterLink to="/SignUp" class="hover:text-blue ">Sign Up</RouterLink>
        </div>
        <div v-else class="ml-auto flex items-center gap-5">
          <!-- the email shows until the profile has loaded -->
          <span class="normal-case text-base">{{ currentProfile?.displayName || currentUser.email }}</span>
          <button @click="handleLogOut" class="uppercase hover:text-blue cursor-pointer">Log Out</button>
        </div>
      </nav>
    </div>
  </header>

  <RouterView />
</template>

<style scoped>
</style>
