<script setup>
import { startingEquipment } from '../../modules/useSelectedClass.js'
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
          <textarea :value="startingEquipment"></textarea>
        </label>

      </div>
    </div>
  </main>
</template>

<style scoped></style>
