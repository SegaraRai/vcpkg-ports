<script lang="ts" setup>
import {
  computedEager,
  useOffsetPagination,
  useUrlSearchParams,
} from "@vueuse/core";
import { computed, nextTick, onMounted, toRef, watchEffect } from "vue";
import { useGlobalRef } from "../../composables/useGlobalRef.mjs";
import { useSearch } from "../../composables/useSearch.mjs";
import {
  SEARCH_MAX_RESULTS_FOR_PAGE,
  SEARCH_MAX_RESULTS_PER_PAGE,
  SEARCH_PAGE_PAGE_KEY,
  SEARCH_PAGE_QUERY_KEY,
  getPortPageURL,
  getSearchPageURL,
} from "../../constants.mjs";
import HighlightMatched from "./HighlightMatched.vue";
import IconLoading from "~icons/line-md/loading-loop";

const qsp = useUrlSearchParams("hash-params", {
  initialValue: {
    [SEARCH_PAGE_QUERY_KEY]: "",
    [SEARCH_PAGE_PAGE_KEY]: null as null | string,
  },
});
const term = toRef(qsp, SEARCH_PAGE_QUERY_KEY);
const pageRaw = toRef(qsp, SEARCH_PAGE_PAGE_KEY);
const page = computed({
  get: () => Number(pageRaw.value) || 1,
  set: (value) => (pageRaw.value = value > 1 ? String(value) : null),
});

onMounted((): void => {
  if (!term.value) {
    location.replace("/");
  }
});

const searchBoxTerm = useGlobalRef("_vpSearchTerm", "");
watchEffect((): void => {
  searchBoxTerm.value = term.value;
});

const { loading, results } = useSearch(term, true);

const { currentPage, pageCount, isFirstPage, isLastPage } = useOffsetPagination(
  {
    total: computed(() =>
      // this is required not to clamp the page number to 1
      loading.value
        ? SEARCH_MAX_RESULTS_FOR_PAGE
        : Math.min(results.value.length, SEARCH_MAX_RESULTS_FOR_PAGE)
    ),
    page,
    pageSize: SEARCH_MAX_RESULTS_PER_PAGE,
  }
);

watchEffect((): void => {
  if (page.value > pageCount.value) {
    page.value = 1;
  }
});

// result slicing
const resultsSliced = computedEager(() =>
  results.value.slice(
    SEARCH_MAX_RESULTS_PER_PAGE * (currentPage.value - 1),
    SEARCH_MAX_RESULTS_PER_PAGE * currentPage.value
  )
);

const getPageURL = (p: number): string => getSearchPageURL(term.value, p, true);

const go = (p: number): void => {
  page.value = p;
  nextTick((): void => {
    window.scrollTo({
      top: 0,
    });
  });
};

const search = (newTerm: string): void => {
  if (!newTerm.trim()) {
    return;
  }

  term.value = newTerm.trim();
  page.value = 1;

  window.scrollTo({
    top: 0,
  });
};

onMounted((): (() => void) => {
  // oxlint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any)._vpSearch = search;

  return (): void => {
    // oxlint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any)._vpSearch;
  };
});
</script>

<template>
  <div class="overflow-auto px-1 py-1 text-base">
    <template v-if="loading">
      <div
        class="text-theme-text-light flex flex-col items-center justify-center gap-y-2 pt-10 pb-14 text-center leading-tight"
      >
        <IconLoading
          aria-label="Loading search results"
          class="h-32 w-32 opacity-80"
        />
      </div>
    </template>
    <template v-else-if="results.length === 0">
      <div
        class="flex flex-col items-center justify-center gap-y-4 pt-3 pb-1 text-center"
      >
        <div v-text="`No ports found for “${term}”`" />
        <div class="text-sm opacity-80">
          Try a shorter name or check the spelling.
        </div>
        <div class="mt-2 flex items-center justify-center gap-4 text-sm">
          <a class="link" data-tabbable href="/">New search</a>
          <a class="link" data-tabbable href="/ports">Browse ports</a>
        </div>
      </div>
    </template>
    <template v-else>
      <div
        class="text-theme-text-light mb-8 text-base"
        v-text="
          `${page > 1 ? `Page ${page} · ` : ''}${results.length.toLocaleString()} ${
            results.length === 1 ? 'match' : 'matches'
          } for “${term}”`
        "
      />
      <ul
        class="text-theme-text-light m-0 mt-2 flex list-none flex-col gap-3.5 p-0"
      >
        <template v-for="result in resultsSliced" :key="result.item.name">
          <li>
            <a
              class="search-result-card"
              data-tabbable
              :href="getPortPageURL(result.item.name)"
            >
              <div
                class="space-x-1.5 overflow-hidden text-ellipsis"
                translate="no"
              >
                <span class="font-bold!" v-text="result.item.name" />
                <span
                  class="text-sm opacity-80"
                  v-text="`v${result.item.version}`"
                />
              </div>
              <template v-if="result.item.description">
                <div
                  class="text-theme-text-light line-clamp-3 overflow-hidden text-sm text-ellipsis **:data-[highlight=true]:font-bold"
                  :title="result.item.description"
                >
                  <HighlightMatched
                    :text="result.item.description"
                    :indices="
                      result.matches?.find((e) => e.key === 'description')
                        ?.indices ?? []
                    "
                  />
                </div>
              </template>
            </a>
          </li>
        </template>
      </ul>
      <template v-if="pageCount > 1">
        <div
          class="text-theme-text-light mt-8 flex items-center justify-center gap-x-4"
        >
          <a
            class="link data-[hidden=true]:invisible"
            :data-hidden="isFirstPage"
            :href="getPageURL(currentPage - 1)"
            @click.prevent="go(currentPage - 1)"
          >
            Previous
          </a>
          <template v-for="p in pageCount" :key="p">
            <template v-if="p === currentPage">
              <span v-text="p" />
            </template>
            <template v-else>
              <a
                class="link"
                :href="getPageURL(p)"
                @click.prevent="go(p)"
                v-text="p"
              />
            </template>
          </template>
          <a
            class="link data-[hidden=true]:invisible"
            :data-hidden="isLastPage"
            :href="getPageURL(currentPage + 1)"
            @click.prevent="go(currentPage + 1)"
          >
            Next
          </a>
        </div>
      </template>
    </template>
  </div>
</template>
