<script lang="ts" setup>
import {
  computedEager,
  useDebounce,
  useMounted,
  useVModel,
} from "@vueuse/core";
import { computed, defineAsyncComponent, shallowRef, watchEffect } from "vue";
import { pickRandom } from "../../../shared/utils.mjs";
import { useSearch } from "../../composables/useSearch.mjs";
import {
  SEARCH_EXAMPLE_TERMS,
  SEARCH_MAX_RESULTS_FOR_POPUP,
  SEARCH_NUM_EXAMPLE_TERMS_SHOWN,
  SEARCH_TERM_DEBOUNCE,
  getPortPageURL,
  getSearchPageURL,
} from "../../constants.mjs";
import { vFocusByKey } from "../../directives/vFocusByKey.mjs";
import SearchBox from "./SearchBox.vue";
import ShortcutKeyHandler from "./ShortcutKeyHandler.vue";

const NO_RESULT_ICONS = [
  defineAsyncComponent(() => import("~icons/line-md/cancel")),
  defineAsyncComponent(() => import("~icons/line-md/alert-circle")),
  defineAsyncComponent(() => import("~icons/line-md/construction")),
  defineAsyncComponent(() => import("~icons/line-md/document")),
  defineAsyncComponent(() => import("~icons/line-md/email-opened")),
  defineAsyncComponent(() => import("~icons/line-md/beer")),
  defineAsyncComponent(() => import("~icons/line-md/emoji-frown")),
  defineAsyncComponent(() => import("~icons/line-md/emoji-frown-open")),
  defineAsyncComponent(() => import("~icons/line-md/emoji-neutral")),
] as const;

const props = defineProps<{
  modelValue: string;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
  (e: "close"): void;
}>();

const mounted = useMounted();

const searchBoxEl = shallowRef<typeof SearchBox | null>(null);

const term = useVModel(props, "modelValue", emit);

const termDebounced = useDebounce(term, SEARCH_TERM_DEBOUNCE);
const { load, loading, results } = useSearch(termDebounced);
const loadingOrWaiting = computedEager(
  (): boolean => loading.value || termDebounced.value !== term.value
);

// lazy load data and fuse
watchEffect((): void => {
  if (term.value) {
    load();
  }
});

// result slicing
const resultsSliced = computedEager(() =>
  results.value.slice(0, SEARCH_MAX_RESULTS_FOR_POPUP)
);
const hasMore = computedEager(
  (): boolean => resultsSliced.value.length < results.value.length
);

// example terms
const exampleTerms = shallowRef(
  SEARCH_EXAMPLE_TERMS.slice(0, SEARCH_NUM_EXAMPLE_TERMS_SHOWN)
);
watchEffect((): void => {
  if (mounted.value && !termDebounced.value) {
    exampleTerms.value = pickRandom(
      SEARCH_EXAMPLE_TERMS,
      SEARCH_NUM_EXAMPLE_TERMS_SHOWN
    );
  }
});

// no result icon
const showNoResult = computed(
  (): boolean => !!termDebounced.value && !results.value.length
);
const noResultIcon = shallowRef(NO_RESULT_ICONS[0]);
watchEffect((): void => {
  if (!showNoResult.value) {
    noResultIcon.value =
      NO_RESULT_ICONS[Math.floor(Math.random() * NO_RESULT_ICONS.length)];
  }
});

// defer focus to prevent '/' key from being typed
const deferFocus = (): void => {
  setTimeout((): void => {
    searchBoxEl.value?.focus();
  }, 0);
};
</script>

<template>
  <div
    ref="containerEl"
    v-focus-by-key
    class="flex max-h-full w-full flex-col gap-y-4 rounded-lg bg-(--theme-bg) px-3 py-4 text-lg"
    @click.stop
    @keydown.escape.prevent.stop="emit('close')"
  >
    <SearchBox
      ref="searchBoxEl"
      v-model="term"
      class="tabbable py-0.5"
      wrapper-class="text-xl"
      focused
      :loading="!!term && loadingOrWaiting"
      @keydown.escape.prevent.stop="term ? (term = '') : emit('close')"
    />
    <ShortcutKeyHandler @press="deferFocus" />
    <div class="overflow-auto text-base">
      <template v-if="loading || !termDebounced">
        <div
          class="flex flex-col items-center justify-center gap-y-2 pt-10 pb-14 text-center leading-tight"
        >
          <div class="opacity-80">Type something to search</div>
          <template v-if="mounted">
            <div class="flex gap-x-2">
              <span class="opacity-80">Example:</span>
              <template v-for="example in exampleTerms" :key="example">
                <button
                  type="button"
                  class="text-(--theme-text-accent)"
                  translate="no"
                  @click="term = example"
                  v-text="example"
                />
              </template>
            </div>
          </template>
        </div>
      </template>
      <template v-else-if="results.length === 0">
        <div
          class="flex flex-col items-center justify-center gap-y-4 pt-3 pb-1 text-center"
        >
          <div class="h-20 w-20 opacity-60">
            <Component :is="noResultIcon" class="h-full w-full" />
          </div>
          <div v-text="`No results for ${termDebounced}`" />
          <div class="mt-4 text-sm">
            &raquo;
            <a class="tabbable link" href="/ports">Port Catalog</a>
          </div>
        </div>
      </template>
      <template v-else>
        <ul class="mt-2 flex flex-col gap-y-4 text-(--theme-text-light)">
          <template v-for="result in resultsSliced" :key="result.item.name">
            <li class="block">
              <a
                class="tabbable flex flex-col gap-y-1 rounded px-2 pt-1 pb-2 leading-tight outline-none! hover:bg-(--theme-bg-accent) focus:bg-(--theme-bg-accent)"
                :href="getPortPageURL(result.item.name)"
              >
                <div
                  class="text-lg font-bold text-(--theme-text-accent)"
                  translate="no"
                  v-text="result.item.name"
                />
                <template v-if="result.item.description">
                  <div
                    class="line-clamp-2 overflow-hidden text-sm text-ellipsis"
                    :title="result.item.description"
                    v-text="result.item.description"
                  />
                </template>
                <template v-else>
                  <div
                    class="line-clamp-2 overflow-hidden text-sm text-ellipsis italic opacity-80"
                  >
                    No description provided
                  </div>
                </template>
              </a>
            </li>
          </template>
        </ul>
        <template v-if="hasMore">
          <div class="mt-8 px-2 text-left text-sm">
            <a class="tabbable link" :href="getSearchPageURL(term)">
              Browse More
            </a>
          </div>
        </template>
      </template>
    </div>
  </div>
</template>
