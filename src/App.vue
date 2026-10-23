<script setup>
import { RouterLink, RouterView, useRouter } from 'vue-router'
import { currentUser, logOut } from '@/components/modules/useAuth.js'

const router = useRouter()

async function handleLogOut() {
  await logOut()
  router.push('/LogIn')
}
</script>

<template>
  <header>
    <div>
      <nav class="bg-dark text-white gap-5 flex min-h-12.5 items-center px-5 uppercase weight-bold text-xl">
        <RouterLink to="/" class="hover:text-blue ">Home</RouterLink>
        <RouterLink v-if="currentUser" to="/MyCharacters" class="hover:text-blue ">My Characters</RouterLink>
        <div v-if="!currentUser" class="ml-auto flex items-center gap-5">
          <RouterLink to="/LogIn" class="hover:text-blue ">Log In</RouterLink>
          <RouterLink to="/SignUp" class="hover:text-blue ">Sign Up</RouterLink>
        </div>
        <div v-else class="ml-auto flex items-center gap-5">
          <span class="normal-case text-base">{{ currentUser.email }}</span>
          <button @click="handleLogOut" class="uppercase hover:text-blue cursor-pointer">Log Out</button>
        </div>
      </nav>
    </div>
  </header>

  <RouterView />
</template>

<style scoped>
</style>
