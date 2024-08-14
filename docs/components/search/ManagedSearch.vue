<script lang="ts" setup>
import { defineAsyncComponent, ref, watchEffect } from "vue";
import { useGlobalRef } from "../../composables/useGlobalRef.mjs";

const component = defineAsyncComponent(() => import("./SearchOverlay.vue"));

const show = useGlobalRef("_vpSearchPopup", false);
const term = useGlobalRef("_vpSearchTerm", "");

watchEffect((): void => {
  if (!show.value) {
    term.value = "";
  }
});

const load = ref(false);
watchEffect((): void => {
  if (show.value) {
    load.value = true;
  }
});
</script>

<template>
  <template v-if="load">
    <Component :is="component" v-model="show" v-model:term="term" />
  </template>
</template>
