<script setup>

</script>

<template>
  <Main>
    <div class="grid grid-cols-5 gap-4 w-full">
      <div class="col-span-2 ">
        <div>
          <input type="number" placeholder="Strength" class=" w-20 h-20 text-2xl text-center"/>
        </div>
        <!-- v-for here to display attributes {stength, dexterity, constitution, intelligence, wisdom, charisma} i could just hard code it but i thing i would rather not -->
      </div>
      <div class="col-span-3 col-start-3 gap-5"> <!-- gap doesnt work so im going to peel my skin off now,  here we go AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA-->
        <!---->
        <div class="flex justify-between items-center gap-2.5">
          <input type="checkbox" class="w-10 h-10"/>
          <label>Inspiration</label>
        </div>
        <div class="flex justify-between items-center gap-2.5">
          <input type="number" class=" w-10 h-10 text-2xl text-center" placeholder="+2"/>
          <label>Proficiency Bonus </label>
        </div>
        <!---->
        <div class=" gap-2.5">
          <div class="flex justify-between items-center gap-2.5">
            <div>
              <!-- v-for here for each saving throw -->
              <input type="checkbox" class="w-10 h-10 text-2xl text-center"/>
              <!-- something here for displaying saving throw number stuff -->
              <label></label>
              <!-- This is a comment -->
            </div>
          </div>
          <label>Saving throws</label>
        </div>
      </div>
    </div>
    <div>    <!--passive perception, other proficiencies & languages-->
      <div class="flex justify-center-safe items-center gap-10">
        <input type="number" class=" w-10 h-10 text-2xl text-center" />
        <label>Passive Perception</label>
      </div>
      <div class="flex flex-col justify-center items-center gap-2.5">
        <textarea class="w-full h-40 border-2"></textarea>
        <label>Other Proficiencies & Languages</label>
      </div>
    </div>
  </Main>
</template>

<style scoped></style>
