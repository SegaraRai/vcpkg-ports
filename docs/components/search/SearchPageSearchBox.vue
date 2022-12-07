<script lang="ts" setup>
import SearchBoxWithSuggest from './SearchBoxWithSuggest.vue';
import { useGlobalRef } from '../../composables/useGlobalRef.mjs';

const searchBoxTerm = useGlobalRef('_vpSearchTerm', '');

const search = (newTerm: string): void => {
  (window as any)._vpSearch?.(newTerm);
};
</script>

<template>
  <SearchBoxWithSuggest v-model="searchBoxTerm" @search="search" />
</template>
