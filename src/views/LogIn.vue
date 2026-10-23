<script setup>
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '@/firebase'

const router = useRouter()
const email = ref('')
const password = ref('')
const error = ref('')

async function logIn() {
  error.value = ''
  try {
    await signInWithEmailAndPassword(auth, email.value, password.value)
    router.push('/MyCharacters')
  } catch (e) {
    error.value = e.message
  }
}
</script>

<template>
  <!-- a <form> so pressing Enter also logs you in -->
  <form @submit.prevent="logIn" class="flex flex-col gap-2 max-w-sm mx-auto p-4">
    <h1 class="text-2xl uppercase">Log In</h1>
    <input v-model="email" type="email" placeholder="Email" required class="border p-2" />
    <input v-model="password" type="password" placeholder="Password" required class="border p-2" />
    <button type="submit" class="border p-2">Log in</button>
    <p v-if="error" class="text-red-600">{{ error }}</p>
    <p>No account yet? <RouterLink to="/SignUp" class="underline">Sign up</RouterLink></p>
  </form>
</template>



<style></style>
