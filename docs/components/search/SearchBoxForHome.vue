<script lang="ts" setup>
import SearchBoxWithSuggest from './SearchBoxWithSuggest.vue';
import { useGlobalRef } from '../../composables/useGlobalRef.mjs';
import { getSearchPageURL } from '../../constants.mjs';

const searchBoxTerm = useGlobalRef('_vpSearchTerm', '');

const search = (newTerm: string): void => {
  location.href = getSearchPageURL(newTerm);
};
</script>

<template>
  <SearchBoxWithSuggest large v-model="searchBoxTerm" @search="search" />
</template>
