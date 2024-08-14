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
    class=":uno: w-full max-h-full px-3 py-4 rounded-2 flex flex-col gap-y-4 bg-[--theme-bg] text-lg"
    @click.stop
    @keydown.escape.prevent.stop="emit('close')"
  >
    <SearchBox
      ref="searchBoxEl"
      v-model="term"
      :class="['tabbable', ':uno: py-0.5']"
      wrapper-class=":uno: text-xl"
      focused
      :loading="!!term && loadingOrWaiting"
      @keydown.escape.prevent.stop="term ? (term = '') : emit('close')"
    />
    <ShortcutKeyHandler @press="deferFocus" />
    <div class=":uno: overflow-auto text-base">
      <template v-if="loading || !termDebounced">
        <div
          class=":uno: flex flex-col gap-y-2 items-center justify-center text-center pt-10 pb-14 leading-tight"
        >
          <div class=":uno: opacity-80">Type something to search</div>
          <template v-if="mounted">
            <div class=":uno: flex gap-x-2">
              <span class=":uno: opacity-80">Example:</span>
              <template v-for="example in exampleTerms" :key="example">
                <button
                  class=":uno: text-[--theme-text-accent]"
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
          class=":uno: flex flex-col gap-y-4 items-center justify-center text-center pt-3 pb-1"
        >
          <div class=":uno: w-20 h-20 opacity-60">
            <Component :is="noResultIcon" class=":uno: w-full h-full" />
          </div>
          <div v-text="`No results for ${termDebounced}`" />
          <div class=":uno: mt-4 text-sm">
            &raquo;
            <a class="tabbable link" href="/ports">Port Catalog</a>
          </div>
        </div>
      </template>
      <template v-else>
        <ul class=":uno: flex flex-col gap-y-4 mt-2 text-[--theme-text-light]">
          <template v-for="result in resultsSliced" :key="result.item.name">
            <li class=":uno: block">
              <a
                :class="[
                  'tabbable',
                  ':uno: flex flex-col gap-y-1 leading-tight !outline-none px-2 pt-1 pb-2 rounded hover:bg-[--theme-bg-accent] focus:bg-[--theme-bg-accent]',
                ]"
                :href="getPortPageURL(result.item.name)"
              >
                <div
                  class=":uno: text-lg font-bold text-[--theme-text-accent]"
                  translate="no"
                  v-text="result.item.name"
                />
                <template v-if="result.item.description">
                  <div
                    class=":uno: text-sm line-clamp-2 overflow-hidden text-ellipsis"
                    :title="result.item.description"
                    v-text="result.item.description"
                  />
                </template>
                <template v-else>
                  <div
                    class=":uno: text-sm line-clamp-2 overflow-hidden text-ellipsis font-italic opacity-80"
                  >
                    No description provided
                  </div>
                </template>
              </a>
            </li>
          </template>
        </ul>
        <template v-if="hasMore">
          <div class=":uno: text-left mt-8 px-2 text-sm">
            <a class="tabbable link" :href="getSearchPageURL(term)">
              Browse More
            </a>
          </div>
        </template>
      </template>
    </div>
  </div>
</template>
