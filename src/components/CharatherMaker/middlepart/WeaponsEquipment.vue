<script setup>
import { computed } from 'vue'
import { classItems } from '../../modules/useSelectedClass.js'
import { backgroundItems, backgroundMoney } from '../../modules/useSelectedBackground.js'
import { mergeItems, isWeapon, weaponRow, gearLine } from '../../modules/useEquipment.js'
import { combatStats } from '../../modules/useLevel.js'

// Class gear + background gear in one pile (doubles added together)
const allItems = computed(() => mergeItems([...classItems.value, ...backgroundItems.value]))

// Weapons go to the attacks table. Always show at least 3 rows, more if you have more weapons.
const weaponRows = computed(() => {
  const rows = allItems.value.filter(isWeapon).map(weaponRow)
  while (rows.length < 3) rows.push({ name: '', damageDie: '', damageType: '' })
  return rows
})

// Everything that ISN'T a weapon (armor, packs, arrows...) goes in the equipment box
const gear = computed(() =>
  allItems.value
    .filter((item) => !isWeapon(item))
    .map(gearLine)
    .join('\n'),
)

// Puts the starting money in the right coin box, e.g. 15 gp -> GP box
const money = computed(() => {
  const coins = { cp: '', sp: '', ep: '', gp: '', pp: '' }
  if (backgroundMoney.value) coins[backgroundMoney.value.unit] = backgroundMoney.value.quantity
  return coins
})
</script>

<template>
  <main>
    <div>

      <div>
        <div id="attacks" class="grid grid-cols-5"> <!-- 3 select collumbs -->
          <div class="col-start-1 col-span-2 border-2"> <!--weapon name -->
            <label for="weaponname0" class="text-nowrap">Weapon Name</label>
            <input v-for="(row, i) in weaponRows" :key="i" :value="row.name" type="text" class="border w-full" placeholder="0" :id="`weaponname${i}`"/>
          </div>
          <div class="col-start-3 col-span-1 border-y-2"> <!--weapon damage -->
            <label for="weapondamage0" class="text-nowrap">Weapon Damage</label>
            <input v-for="(row, i) in weaponRows" :key="i" :value="row.damageDie" type="text" class="border w-full" placeholder="0" :id="`weapondamage${i}`"/>
          </div>
          <div class="col-start-4 col-span-2 border-2"> <!--weapon damage kind -->
            <label for="weapondamagekind0" class="text-nowrap">Weapon Damage Kind</label>
            <input v-for="(row, i) in weaponRows" :key="i" :value="row.damageType" type="text" class="border w-full" placeholder="0" :id="`weapondamagekind${i}`"/>
          </div>
          <div class="col-start-1 col-span-5"> <!-- combat stats from your class: rage, ki, sneak attack... -->
            <textarea class="w-full min-h-80 border-2" :value="combatStats"></textarea>
          </div>
        </div>
        <label for="attacks" class="flex justify-center items-center">attacks and spellcasting</label>
      </div>


      <div id="equipment" class="grid grid-cols-5 w-full min-h-87.5">
        <div class="col-start-1 col-span-1 flex flex-col justify-between max-h-3/5"> <!--money-->
          <label for="copperPieces" class="text-nowrap flex justify-center items-center gap-2.5">
            <p>CP</p>
            <input type="number" class="border w-full" placeholder="0" id="copperPieces" :value="money.cp"/>
          </label>
          <label for="silverPieces" class="text-nowrap flex justify-center items-center gap-2.5">
            <p>SP</p>
            <input type="number" class="border w-full" placeholder="0" id="silverPieces" :value="money.sp"/>
          </label>
          <label for="electrumPieces" class="text-nowrap flex justify-center items-center gap-2.5">
            <p>EP</p>
            <input type="number" class="border w-full" placeholder="0" id="electrumPieces" :value="money.ep"/>
          </label>
          <label for="goldPieces" class="text-nowrap flex justify-center items-center gap-2.5">
            <p>GP</p>
            <input type="number" class="border w-full" placeholder="0" id="goldPieces" :value="money.gp"/>
          </label>
          <label for="platinumPieces" class="text-nowrap flex justify-center items-center gap-2.5">
            <p>PP</p>
            <input type="number" class="border w-full" placeholder="0" id="platinumPieces" :value="money.pp"/>
          </label>
        </div>
        <textarea class="col-span-4 w-full border-2 rounded-xs" :value="gear"></textarea>

      </div>
      <label for="equipment" class="flex justify-center items-center">equipment</label>
    </div>
  </main>
</template>

<style scoped></style>
