<script setup>
import { ref } from 'vue'
import AdminUsers from '@/components/Admin/AdminUsers.vue'
import AdminCampaigns from '@/components/Admin/AdminCampaigns.vue'

// /Admin: only for admin accounts (the router and the Firestore rules both check)
const tabs = [
  { id: 'users', label: 'Accounts' },
  { id: 'campaigns', label: 'Campaigns' },
]
const activeTab = ref('users')
</script>

<template>
  <main class="flex flex-col gap-4 max-w-3xl mx-auto p-4">
    <h1 class="text-2xl uppercase">Admin</h1>

    <nav class="flex gap-2 overflow-x-auto border-b-2 border-black">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        @click="activeTab = tab.id"
        :class="[
          'px-4 py-1 rounded-t-md border-2 border-b-0 border-black cursor-pointer whitespace-nowrap',
          activeTab === tab.id ? 'bg-black text-white' : '',
        ]"
      >
        {{ tab.label }}
      </button>
    </nav>

    <!-- v-if: each tab loads its list when you open it, so switching back gets a fresh one -->
    <AdminUsers v-if="activeTab === 'users'" />
    <AdminCampaigns v-if="activeTab === 'campaigns'" />
  </main>
</template>
