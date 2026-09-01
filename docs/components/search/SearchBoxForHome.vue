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
  <form
    class="@max-home-search/home-search:flex-col flex w-full items-start gap-3"
    role="search"
    @submit.prevent="search(searchBoxTerm)"
  >
    <SearchBoxWithSuggest
      v-model="searchBoxTerm"
      class="min-w-0 flex-1"
      large
      :auto-focus="false"
      placeholder="Search for a port (e.g. openssl, boost, fmt)"
      @search="search"
    />
    <button
      class="bg-theme-action-bg text-theme-action-text hover:bg-theme-action-bg-hover @max-home-search/home-search:w-full min-h-13 shrink-0 rounded-lg border border-transparent px-7 font-semibold transition-[color,background-color,border-color,transform] duration-150 active:translate-y-px"
      type="submit"
    >
      Search
    </button>
  </form>
</template>
