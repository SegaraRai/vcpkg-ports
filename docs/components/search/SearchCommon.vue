<script lang="ts" setup>
import {
  computedEager,
  useDebounce,
  useMounted,
  useVModel,
} from '@vueuse/core';
import {
  computed,
  defineAsyncComponent,
  ref,
  shallowRef,
  watchEffect,
} from 'vue';
import { getPortPageURL } from '../../../shared/pageConstants.mjs';
import { pickRandom } from '../../../shared/utils.mjs';
import { useSearch } from '../../composables/useSearch.mjs';
import {
  SEARCH_EXAMPLE_TERMS,
  SEARCH_NUM_EXAMPLE_TERMS_SHOWN,
  SEARCH_PAGE_QUERY_KEY,
} from '../../constants.mjs';
import SearchBox from './SearchBox.vue';
import ShortcutKeyHandler from './ShortcutKeyHandler.vue';

const NO_RESULT_ICONS = [
  defineAsyncComponent(() => import('~icons/line-md/cancel')),
  defineAsyncComponent(() => import('~icons/line-md/alert-circle')),
  defineAsyncComponent(() => import('~icons/line-md/construction')),
  defineAsyncComponent(() => import('~icons/line-md/document')),
  defineAsyncComponent(() => import('~icons/line-md/email-opened')),
  defineAsyncComponent(() => import('~icons/line-md/beer')),
  defineAsyncComponent(() => import('~icons/line-md/emoji-frown')),
  defineAsyncComponent(() => import('~icons/line-md/emoji-frown-open')),
  defineAsyncComponent(() => import('~icons/line-md/emoji-neutral')),
] as const;

const props = defineProps<{
  modelValue: string;
  maxResults: number;
  showMore?: boolean;
  enableKeys?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();

const mounted = useMounted();

const term = useVModel(props, 'modelValue', emit);

const termDebounced = useDebounce(term, 200);
const { load, loading, results } = useSearch(termDebounced);
const loadingOrWaiting = computedEager(
  () => loading.value || termDebounced.value !== term.value
);

// lazy load data and fuse
watchEffect((): void => {
  if (term.value) {
    load();
  }
});

// result slicing
const resultsSliced = computedEager(() =>
  results.value.slice(0, props.maxResults)
);
const hasMore = computedEager(
  () => resultsSliced.value.length < results.value.length
);

// example terms
const exampleTerms = ref(
  SEARCH_EXAMPLE_TERMS.slice(0, SEARCH_NUM_EXAMPLE_TERMS_SHOWN)
);
watchEffect(() => {
  if (mounted.value && !termDebounced.value) {
    exampleTerms.value = pickRandom(
      SEARCH_EXAMPLE_TERMS,
      SEARCH_NUM_EXAMPLE_TERMS_SHOWN
    );
  }
});

// no result icon
const showNoResult = computed(
  () => !!termDebounced.value && !results.value.length
);
const noResultIcon = shallowRef(NO_RESULT_ICONS[0]);
watchEffect((): void => {
  if (!showNoResult.value) {
    noResultIcon.value =
      NO_RESULT_ICONS[Math.floor(Math.random() * NO_RESULT_ICONS.length)];
  }
});

// move focus by ↑ ↓ key
const searchBoxEl = ref<typeof SearchBox | null>(null);
const containerEl = ref<HTMLDivElement | null>(null);
const moveFocus = (offset: number): void => {
  const tabbableElements = containerEl.value?.querySelectorAll('.tabbable');
  if (!tabbableElements) {
    return;
  }
  const tabbableElementsArray = Array.from(tabbableElements) as HTMLElement[];
  const currentFocusIndex = tabbableElementsArray.findIndex(
    (el) => el === document.activeElement
  );
  if (currentFocusIndex < 0) {
    return;
  }
  const nextFocusIndex =
    (currentFocusIndex + offset + tabbableElementsArray.length) %
    tabbableElementsArray.length;
  const nextFocusElement = tabbableElementsArray[nextFocusIndex];
  setTimeout((): void => {
    nextFocusElement?.focus();
  }, 0);
};
const moveFocusByKey = (event: KeyboardEvent): void => {
  if (!props.enableKeys) {
    return;
  }

  if ((event.target as HTMLElement | null)?.tagName !== 'INPUT') {
    if (/^[A-Z]$/i.test(event.key)) {
      searchBoxEl.value?.focus();
      return;
    }
  }

  const offset =
    event.key === 'ArrowUp' ? -1 : event.key === 'ArrowDown' ? 1 : 0;
  if (!offset) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();
  moveFocus(offset);
};

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
    class=":uno: w-full max-h-full px-3 py-4 rounded-2 flex flex-col gap-y-4 bg-[var(--theme-bg)] text-lg"
    @click.stop
  >
    <SearchBox
      ref="searchBoxEl"
      :class="['tabbable', ':uno: py-0.5']"
      wrapper-class=":uno: text-xl"
      v-model="term"
      focused
      :loading="!!term && loadingOrWaiting"
      @keydown="moveFocusByKey"
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
                  class=":uno: text-[var(--theme-text-accent)]"
                  v-text="example"
                  @click="term = example"
                ></button>
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
          <div v-text="`No results for ${termDebounced}`"></div>
          <div class=":uno: mt-4 text-sm">
            &raquo;
            <a class="tabbable link" href="/ports" @keydown="moveFocusByKey">
              Port Catalog
            </a>
          </div>
        </div>
      </template>
      <template v-else>
        <ul
          class=":uno: flex flex-col gap-y-4 mt-2 text-[var(--theme-text-light)]"
        >
          <template v-for="result in resultsSliced">
            <li class=":uno: block">
              <a
                :class="[
                  'tabbable',
                  ':uno: flex flex-col gap-y-1 leading-tight px-2 pt-1 pb-2 rounded hover:bg-[var(--theme-bg-accent)] focus:bg-[var(--theme-bg-accent)]',
                ]"
                :href="getPortPageURL(result.item.name)"
                :title="result.item.description"
                @keydown="moveFocusByKey"
              >
                <div
                  class=":uno: text-lg font-bold text-[var(--theme-text-accent)]"
                >
                  {{ result.item.name }}
                </div>
                <template v-if="result.item.description">
                  <div
                    class=":uno: text-sm line-clamp-2 overflow-hidden text-ellipsis"
                  >
                    {{ result.item.description }}
                  </div>
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
        <template v-if="showMore && hasMore">
          <div class=":uno: text-left mt-8 px-2 text-sm">
            <a
              class="tabbable link"
              :href="`/#${SEARCH_PAGE_QUERY_KEY}=${encodeURIComponent(term)}`"
              @keydown="moveFocusByKey"
            >
              Browse More
            </a>
          </div>
        </template>
      </template>
    </div>
  </div>
</template>
