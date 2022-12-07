<script lang="ts" setup>
import { computed, nextTick, onMounted, toRef, watchEffect } from 'vue';
import {
  SEARCH_MAX_RESULTS_FOR_PAGE,
  SEARCH_MAX_RESULTS_PER_PAGE,
  SEARCH_PAGE_PAGE_KEY,
  SEARCH_PAGE_QUERY_KEY,
  getSearchPageURL,
} from '../../constants.mjs';
import { useSearch } from '../../composables/useSearch.mjs';
import {
  computedEager,
  useOffsetPagination,
  useUrlSearchParams,
} from '@vueuse/core';
import { getPortPageURL } from '../../constants.mjs';
import { pluralize } from '../portPage/utils/pluralize.mjs';
import HighlightMatched from './HighlightMatched.vue';
import { useGlobalRef } from '../../composables/useGlobalRef.mjs';

const qsp = useUrlSearchParams('hash-params', {
  initialValue: {
    [SEARCH_PAGE_QUERY_KEY]: '',
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
    location.replace('/');
  }
});

const searchBoxTerm = useGlobalRef('_vpSearchTerm', '');
watchEffect((): void => {
  searchBoxTerm.value = term.value;
});

const { loading, results } = useSearch(term, false, true);

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
  (window as any)._vpSearch = search;

  return (): void => {
    delete (window as any)._vpSearch;
  };
});
</script>

<template>
  <div class=":uno: overflow-auto text-base">
    <template v-if="loading">
      <div
        class=":uno: flex flex-col gap-y-2 items-center justify-center text-center pt-10 pb-14 leading-tight text-[var(--theme-text-light)]"
      >
        <div
          aria-label="Loading data"
          class=":uno: w-32 h-32 opacity-80 i-line-md-loading-loop"
        ></div>
      </div>
    </template>
    <template v-else-if="results.length === 0">
      <div
        class=":uno: flex flex-col gap-y-4 items-center justify-center text-center pt-3 pb-1"
      >
        <div v-text="`No results for ${term}`" />
        <div class=":uno: mt-4 text-sm">
          &raquo;
          <a class="tabbable link" href="/ports"> Port Catalog </a>
        </div>
      </div>
    </template>
    <template v-else>
      <div
        class=":uno: mb-8 text-base text-[var(--theme-text-light)]"
        v-text="
          `${page > 1 ? `Page ${page} of ` : ''}${pluralize(
            results.length,
            'result',
            page === 1
          )} for ${term}`
        "
      />
      <ul
        class=":uno: flex flex-col gap-y-8 mt-2 text-[var(--theme-text-light)]"
      >
        <template v-for="result in resultsSliced" :key="result.item.name">
          <li class=":uno: block">
            <div class=":uno: flex flex-col gap-y-1 leading-tight">
              <div class=":uno: overflow-hidden text-ellipsis">
                <a
                  :class="['link', ':uno: text-lg !font-bold mr-2']"
                  :href="getPortPageURL(result.item.name)"
                  v-text="result.item.name"
                />
                <span
                  class=":uno: text-sm opacity-80"
                  v-text="`v${result.item.version}`"
                />
              </div>
              <template v-if="result.item.description">
                <div
                  class=":uno: text-sm line-clamp-3 overflow-hidden text-ellipsis text-[var(--theme-text-light)]"
                  :title="result.item.description"
                >
                  <HighlightMatched
                    :text="result.item.description"
                    :indices="
                      result.matches?.find((e) => e.key === 'description')
                        ?.indices || []
                    "
                    highlight-class=":uno: font-bold"
                  />
                </div>
              </template>
              <template v-else>
                <div
                  class=":uno: text-sm line-clamp-3 overflow-hidden text-ellipsis text-[var(--theme-text-light)] font-italic opacity-80"
                >
                  No description provided
                </div>
              </template>
            </div>
          </li>
        </template>
      </ul>
      <template v-if="pageCount > 1">
        <div
          class=":uno: flex gap-x-4 mt-8 justify-center items-center text-[var(--theme-text-light)]"
        >
          <a
            class="link"
            :class="isFirstPage && ':uno: invisible'"
            :href="getPageURL(currentPage - 1)"
            @click.prevent="go(currentPage - 1)"
          >
            prev
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
            class="link"
            :class="isLastPage && ':uno: invisible'"
            :href="getPageURL(currentPage + 1)"
            @click.prevent="go(currentPage + 1)"
          >
            next
          </a>
        </div>
      </template>
    </template>
  </div>
</template>
