<script setup>
import { ref, watch } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { currentUser, logOut } from '@/components/modules/useAuth.js'
import { currentProfile, isDM, isAdmin } from '@/components/modules/useProfile.js'
import ProfilePicture from '@/components/Account/ProfilePicture.vue'

const route = useRoute()

// is the burger menu open (only matters on phones)
const menuOpen = ref(false)

// close the menu when you go to another page
watch(() => route.fullPath, () => {
  menuOpen.value = false
})


</script>

<template>
  <header>
    <div>
      <!-- phone only: an invisible layer behind the open dropdown, tapping anywhere outside closes it -->
      <div v-if="menuOpen" @click="menuOpen = false" class="fixed inset-0 z-40 md:hidden"></div>

      <!-- relative + z-50: the dropdown is positioned from the nav and sits on top of the page -->
      <nav class="relative z-50 bg-paperdarkest text-white flex items-center gap-5 min-h-12.5 px-5 py-2 uppercase weight-bold text-xl">
        <!-- phone only: the burger button, hidden from md (768px) and up -->
        <button
          @click="menuOpen = !menuOpen"
          class="md:hidden shrink-0 cursor-pointer hover:text-blue"
          :aria-expanded="menuOpen"
          aria-label="Toggle menu"
        >
            <!-- three lines when closed, an X when open -->
          <svg v-if="!menuOpen" xmlns="http://www.w3.org/2000/svg" class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        <!-- the links: on phones a dropdown box that floats over the page under the nav (absolute, so the nav doesn't get taller),
             on bigger screens a normal row inside the nav (static) -->
        <div
          :class="menuOpen ? 'flex' : 'hidden'"
          class="absolute top-full left-0 min-w-56 flex-col items-start gap-y-3 bg-paperdarkest px-5 py-4 rounded-br-lg shadow-lg
                 md:static md:flex md:flex-row md:flex-wrap md:items-center md:gap-x-5 md:gap-y-1 md:min-w-0 md:p-0 md:rounded-none md:shadow-none"
        >
          <RouterLink to="/" class="hover:text-blue ">Home</RouterLink>
          <RouterLink v-if="currentUser" to="/MyCharacters" class="hover:text-blue ">My Characters</RouterLink>
          <RouterLink v-if="currentUser" to="/Campaigns" class="hover:text-blue ">Campaigns</RouterLink>
          <router-link v-if="currentUser && isDM" to="/DungeonMaster" class="hover:text-blue ">Dungeon Master</router-link>
          <RouterLink v-if="currentUser && isAdmin" to="/Admin" class="hover:text-blue ">Admin</RouterLink>
        </div>

        <!-- always on the top right, on every screen size (not in the burger menu) -->
        <div v-if="!currentUser" class="ml-auto flex items-center gap-5">
          <RouterLink to="/LogIn" class="hover:text-blue ">Log In</RouterLink>
          <RouterLink to="/SignUp" class="hover:text-blue ">Sign Up</RouterLink>
        </div>
        <div v-else class="ml-auto flex items-center gap-5 min-w-0">
          <!-- the email shows until the profile has loaded -->
          <RouterLink to="/MyAccount" class="flex items-center gap-2 normal-case text-base hover:text-blue min-w-0">
            <ProfilePicture :url="currentProfile?.photoURL" :name="currentProfile?.displayName || currentUser.email" size="w-8 h-8 text-sm" />
            <!-- truncate: a long name/email gets cut off with ... instead of pushing the burger off the screen -->
            <span class="truncate">{{ currentProfile?.displayName || currentUser.email }}</span>
          </RouterLink>
        </div>
      </nav>
    </div>
  </header>

  <RouterView />
</template>

<style scoped>
</style>
