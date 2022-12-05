<script lang="ts" setup>
import SearchBoxButton from './SearchBoxButton.vue';
import ShortcutKeyHandler from './ShortcutKeyHandler.vue';
import { useSearchShow } from './managedStore.mjs';

const show = useSearchShow();

const showOverlay = (): void => {
  show.value = true;
};
</script>

<template>
  <SearchBoxButton @click="showOverlay" />
  <ShortcutKeyHandler @press="showOverlay" />
</template>
