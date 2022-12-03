<script lang="ts" setup>
import { useSearchShow, useSearchTerm } from './managedStore.mjs';
import { defineAsyncComponent, ref, watchEffect } from 'vue';

const show = useSearchShow();
const term = useSearchTerm();
const component = defineAsyncComponent(() => import('./SearchOverlay.vue'));

watchEffect(() => {
  if (!show.value) {
    term.value = '';
  }
});

const load = ref(false);
watchEffect(() => {
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
