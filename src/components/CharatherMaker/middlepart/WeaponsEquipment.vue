<script setup>
import { computed } from 'vue'
import { startingEquipment } from '../../modules/useSelectedClass.js'
import { backgroundEquipment } from '../../modules/useSelectedBackground.js'

// Class gear + background gear in one list (skip empty ones)
const allEquipment = computed(() =>
  [startingEquipment.value, backgroundEquipment.value].filter((text) => text !== '').join('\n'),
)
</script>

<template>
  <main>
    <div>
      <div class=""> <!-- 3 select collumbs -->
        <label> <!-- Select Weapon -->

        </label>
        <label><!--atk of weapon-->

        </label>
        <label><!--type of weapon-->

        </label>
      </div>
      <div>
        <label class="flex flex-col">
          <textarea class="w-full min-h-80 border-2" :value="allEquipment"></textarea>
        </label>

      </div>
    </div>
  </main>
</template>

<style scoped></style>
