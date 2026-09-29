<script setup>

</script>


<template>
  <Main>
    <div class="flex flex-col gap-6">
      <div class="flex justify-center items-center gap-2.5"> <!--armoor class, intitiative, speed-->
        <div class="w-1/3  flex justify-center">
          <input type="number" class="w-35 h-35 text-center border-2 text-4xl" placeholder="0" id="armorclass">
          <label for="armorclass" class="absolute text-xs text-gray-500">Armor</label> <!--ac calculated n stffu-->
        </div>
        <div class="w-1/3   flex justify-center">
          <input type="number" class="w-35 h-35 text-center border-2 text-4xl" placeholder="0" id="initiative">
          <label for="initiative" class="absolute text-xs text-gray-500">Initiative</label> <!--initiative modifier-->
        </div>
        <div class="w-1/3  flex justify-center">
          <input type="number" class="w-35 h-35 text-center border-2 text-4xl" placeholder="0" id="speed">
          <label for="speed" class="absolute text-xs text-gray-500">Speed</label> <!--speed calculated from race and stuff-->
        </div>
      </div>
      <div>
        <div class="flex justify-center items-center gap-2.5 w-full"> <!--hit points, hit dice, temporary hitpoints, death saves-->
          <label for="maxhitpoints" class="text-nowrap">Hit Point Maximum</label>
          <input type="number" class="border-2 w-full" placeholder="0" id="maxhitpoints"/>
        </div>
        <div class="flex flex-col ">
          <input type="number" class="border-2 w-full h-40 text-5xl text-center" placeholder="0" id="currenthitpoints"/>
          <label for="currenthitpoints" class="text-nowrap flex justify-center">Current Hit Points</label>
        </div>
        <div class="flex flex-col ">
          <input type="number" class="border-2 w-full h-40 text-5xl text-center" placeholder="0" id="temporaryhitpoints"/>
          <label for="temporaryhitpoints" class="text-nowrap flex justify-center">Temporary Hit Points</label>
        </div>
      </div>
      <div>
        <div class=" w-full flex justify-between items-center gap-2.5"> <!--hit dice total, hit dice, death saving throws-->
          <div class="w-1/2"> <!--hit dice total, hit dice-->
            <div class="flex justify-center items-center gap-2.5 text-nowrap ">
              <label for="hitdicetotal">hit dice total</label>
              <input type="number" class="border-2 w-full" placeholder="0" id="hitdicetotal"/>
            </div>
            <div class="flex flex-col justify-center   items-center gap-2.5 text-nowrap">
              <input type="text" class="border-2 h-20 w-90% text-center " placeholder="0" id="hitdice"/>
              <label for="hitdice" class="text-xs text-gray-500 text-center">hit dice</label>
            </div>
          </div>
          <div class="w-1/2" > <!--death saving throws-->
            <div class="flex justify-center items-center gap-2.5 text-nowrap">
              <input type="checkbox" class="w-7 h-7"/>
              <input type="checkbox" class="w-7 h-7"/>
              <input type="checkbox" class="w-7 h-7"/>
            </div>
            <div class="flex justify-center items-center gap-2.5 text-nowrap">
              <input type="checkbox" class="w-7 h-7"/>
              <input type="checkbox" class="w-7 h-7"/>
              <input type="checkbox" class="w-7 h-7"/>
            </div>
            <label class="text-nowrap flex justify-center">Death Saving Throws</label>
          </div>
        </div>
      </div>
    </div>
  </Main>
</template>


<style>

</style>
