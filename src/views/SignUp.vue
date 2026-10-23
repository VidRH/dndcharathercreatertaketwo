<script setup>
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { auth } from '@/firebase'

const router = useRouter()
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const error = ref('')

async function signUp() {
  error.value = ''

  // Check this ourselves BEFORE asking Firebase, so a typo can't lock you out of your new account
  if (password.value !== confirmPassword.value) {
    error.value = "The passwords don't match."
    return
  }

  try {
    await createUserWithEmailAndPassword(auth, email.value, password.value)
    router.push('/MyCharacters')
  } catch (e) {
    error.value = e.message
  }
}
</script>

<template>
  <!-- a <form> so pressing Enter also signs you up -->
  <form @submit.prevent="signUp" class="flex flex-col gap-2 max-w-sm mx-auto p-4">
    <h1 class="text-2xl uppercase">Sign Up</h1>
    <input v-model="email" type="email" placeholder="Email" required class="border p-2" />
    <input v-model="password" type="password" placeholder="Password (6+ chars)" required class="border p-2" />
    <input v-model="confirmPassword" type="password" placeholder="Confirm password" required class="border p-2" />
    <button type="submit" class="border p-2">Sign up</button>
    <p v-if="error" class="text-red-600">{{ error }}</p>
    <p>Already have an account? <RouterLink to="/LogIn" class="underline">Log in</RouterLink></p>
  </form>
</template>

<style></style>
