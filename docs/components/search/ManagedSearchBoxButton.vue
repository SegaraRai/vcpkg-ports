<script lang="ts" setup>
import SearchBoxButton from './SearchBoxButton.vue';
import ShortcutKeyHandler from './ShortcutKeyHandler.vue';
import { useGlobalRef } from '../../composables/useGlobalRef.mjs';

const show = useGlobalRef('_vpSearchPopup', false);

const showOverlay = (): void => {
  show.value = true;
};
</script>

<template>
  <SearchBoxButton @click="showOverlay" />
  <ShortcutKeyHandler @press="showOverlay" />
</template>
