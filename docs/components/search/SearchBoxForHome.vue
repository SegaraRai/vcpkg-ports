<script lang="ts" setup>
import { useGlobalRef } from "../../composables/useGlobalRef.mjs";
import { getSearchPageURL } from "../../constants.mjs";
import SearchBoxWithSuggest from "./SearchBoxWithSuggest.vue";

const searchBoxTerm = useGlobalRef("_vpSearchTerm", "");

const search = (newTerm: string): void => {
  location.href = getSearchPageURL(newTerm);
};
</script>

<template>
  <SearchBoxWithSuggest v-model="searchBoxTerm" large @search="search" />
</template>
