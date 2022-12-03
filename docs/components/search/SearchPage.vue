<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import SearchCommon from './SearchCommon.vue';
import {
  SEARCH_MAX_RESULTS_FOR_PAGE,
  SEARCH_PAGE_QUERY_KEY,
} from '../../constants.mjs';

const term = ref('');
onMounted((): void => {
  const termFromQuery = new URLSearchParams(location.hash.slice(1)).get(
    SEARCH_PAGE_QUERY_KEY
  );
  if (termFromQuery) {
    term.value = termFromQuery;

    // remove the query from the URL
    history.replaceState(null, '', location.pathname);
  }
});
</script>

<template>
  <SearchCommon v-model="term" :max-results="SEARCH_MAX_RESULTS_FOR_PAGE" />
</template>
