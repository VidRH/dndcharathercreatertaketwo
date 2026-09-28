<script setup>

</script>

<template>
  <Main class="w-1/3 ">
    <div class="w-full">
      <div class=" w-full flex flex-col  h-50">
          <textarea id="personalityTraits" class="border-2 border-black rounded-md mt-2 mx-3 h-full"></textarea>
          <label for="personalityTraits" class="flex justify-center items-center">personality traits</label>
      </div>
      <div class=" w-full flex flex-col h-50">
        <textarea id="ideals" class="border-2 border-black rounded-md mt-2 mx-3 h-full"></textarea>
        <label for="ideals" class="flex justify-center items-center">ideals</label>
      </div>
      <div class=" w-full flex flex-col h-50">
        <textarea id="bonds" class="border-2 border-black rounded-md mt-2 mx-3 h-full"></textarea>
        <label for="bonds" class="flex justify-center items-center">bonds</label>
      </div>
      <div class=" w-full flex flex-col h-50">
        <textarea id="flaws" class="border-2 border-black rounded-md mt-2 mx-3 h-full"></textarea>
        <label for="flaws" class="flex justify-center items-center">flaws</label>
      </div>
    </div>
    <div class=" w-full flex flex-col h-150">
      <textarea id="features&traits" class="border-2 border-black rounded-md mt-2 mx-3 h-full"></textarea>
      <label for="features&traits" class="flex justify-center items-center">Fetures & Traits</label>
     </div>
  </Main>
</template>

<style scoped></style>
