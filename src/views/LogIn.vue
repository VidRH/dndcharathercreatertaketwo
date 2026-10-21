<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from 'firebase/auth'
import { auth } from '@/firebase'

const router = useRouter()
const email = ref('')
const password = ref('')
const error = ref('')

async function logIn() {
  error.value = ''
  try {
    await signInWithEmailAndPassword(auth, email.value, password.value)
    router.push('/CharatherMaker')
  } catch (e) {
    error.value = e.message
  }
}

async function signUp() {
  error.value = ''
  try {
    await createUserWithEmailAndPassword(auth, email.value, password.value)
    router.push('/CharatherMaker')
  } catch (e) {
    error.value = e.message
  }
}
</script>

<template>
  <main class="flex flex-col gap-2 max-w-sm mx-auto p-4">
    <input v-model="email" type="email" placeholder="Email" class="border p-2" />
    <input v-model="password" type="password" placeholder="Password (6+ chars)" class="border p-2" />
    <button @click="logIn" class="border p-2">Log in</button>
    <button @click="signUp" class="border p-2">Sign up</button>
    <p v-if="error" class="text-red-600">{{ error }}</p>
  </main>
</template>



<style></style>
