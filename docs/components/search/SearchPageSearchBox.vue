<script lang="ts" setup>
import { useGlobalRef } from "../../composables/useGlobalRef.mjs";
import SearchBoxWithSuggest from "./SearchBoxWithSuggest.vue";

const searchBoxTerm = useGlobalRef("_vpSearchTerm", "");

const search = (newTerm: string): void => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any)._vpSearch?.(newTerm);
};
</script>

<template>
  <SearchBoxWithSuggest v-model="searchBoxTerm" @search="search" />
</template>
