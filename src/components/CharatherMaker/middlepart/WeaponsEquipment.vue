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

      <div>
        <div id="attacks" class="grid grid-cols-5"> <!-- 3 select collumbs -->
          <div class="col-start-1 col-span-2 border-2"> <!--weapon name -->
            <label for="weaponname" class="text-nowrap">Weapon Name</label>
            <input type="text" class="border w-full" placeholder="0" id="weaponname"/>
            <input type="text" class="border w-full" placeholder="0" id="weaponname"/>
            <input type="text" class="border w-full" placeholder="0" id="weaponname"/>
          </div>
          <div class="col-start-3 col-span-1 border-y-2"> <!--weapon damage -->
            <label for="weapondamage" class="text-nowrap">Weapon Damage</label>
            <input type="text" class="border w-full" placeholder="0" id="weapondamage"/>
            <input type="text" class="border w-full" placeholder="0" id="weapondamage"/>
            <input type="text" class="border w-full" placeholder="0" id="weapondamage"/>
          </div>
          <div class="col-start-4 col-span-2 border-2"> <!--weapon damage kind -->
            <label for="weapondamagekind" class="text-nowrap">Weapon Damage Kind</label>
            <input type="text" class="border w-full" placeholder="0" id="weapondamagekind"/>
            <input type="text" class="border w-full" placeholder="0" id="weapondamagekind"/>
            <input type="text" class="border w-full" placeholder="0" id="weapondamagekind"/>
          </div>
          <div class="col-start-1 col-span-5">
            <textarea class="w-full min-h-80 border-2" :value="allEquipment"></textarea>
          </div>
        </div>
        <label for="attacks" class="flex justify-center items-center">attacks and spellcasting</label>
      </div>


      <div id="equipment" class="grid grid-cols-5 w-full min-h-87.5">
        <div class="col-start-1 col-span-1 flex flex-col justify-between max-h-3/5"> <!--money-->
          <label for="copperPieces" class="text-nowrap flex justify-center items-center gap-2.5">
            <p>CP</p>
            <input type="number" class="border w-full" placeholder="0" id="copperPieces"/>
          </label>
          <label for="silverPieces" class="text-nowrap flex justify-center items-center gap-2.5">
            <p>SP</p>
            <input type="number" class="border w-full" placeholder="0" id="silverPieces"/>
          </label>
          <label for="electrumPieces" class="text-nowrap flex justify-center items-center gap-2.5">
            <p>EP</p>
            <input type="number" class="border w-full" placeholder="0" id="electrumPieces"/>
          </label>
          <label for="goldPieces" class="text-nowrap flex justify-center items-center gap-2.5">
            <p>GP</p>
            <input type="number" class="border w-full" placeholder="0" id="goldPieces"/>
          </label>
          <label for="platinumPieces" class="text-nowrap flex justify-center items-center gap-2.5">
            <p>PP</p>
            <input type="number" class="border w-full" placeholder="0" id="platinumPieces"/>
          </label>
        </div>
        <textarea class="col-span-4 w-full border-2 rounded-xs" :value="allEquipment"></textarea>

      </div>
      <label for="equipment" class="flex justify-center items-center">equipment</label>
    </div>
  </main>
</template>

<style scoped></style>
