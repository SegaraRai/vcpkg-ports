<script lang="ts" setup>
import { useGlobalRef } from "../../composables/useGlobalRef.mjs";
import SearchBoxButton from "./SearchBoxButton.vue";
import ShortcutKeyHandler from "./ShortcutKeyHandler.vue";

const show = useGlobalRef("_vpSearchPopup", false);

const showOverlay = (): void => {
  show.value = true;
};
</script>

<template>
  <SearchBoxButton @click="showOverlay" />
  <ShortcutKeyHandler @press="showOverlay" />
</template>
