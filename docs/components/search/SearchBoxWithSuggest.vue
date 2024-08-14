<script lang="ts" setup>
import { vOnClickOutside } from '@vueuse/components';
import { computedEager, useDebounce, useVModel } from '@vueuse/core';
import { ref, shallowRef, watch, watchEffect } from 'vue';
import { useSearch } from '../../composables/useSearch.mjs';
import {
  SEARCH_MAX_RESULTS_FOR_SUGGEST,
  SEARCH_TERM_DEBOUNCE,
  getPortPageURL,
} from '../../constants.mjs';
import { vFocusByKey } from '../../directives/vFocusByKey.mjs';
import HighlightMatched from './HighlightMatched.vue';
import SearchBox from './SearchBox.vue';
import ShortcutKeyHandler from './ShortcutKeyHandler.vue';

const props = defineProps<{
  modelValue: string;
  large?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'search', value: string): void;
}>();

const term = useVModel(props, 'modelValue', emit);
const show = ref(false);

const termDebounced = useDebounce(term, SEARCH_TERM_DEBOUNCE);
const { load, loading, results } = useSearch(termDebounced, true);
const loadingOrWaiting = computedEager(
  (): boolean => loading.value || termDebounced.value !== term.value
);

// lazy load data and fuse
watchEffect((): void => {
  if (term.value) {
    load();
  }
});

watch(term, (value): void => {
  show.value = value.length > 0;
});

// result slicing
const resultsSliced = computedEager(() =>
  results.value.slice(0, SEARCH_MAX_RESULTS_FOR_SUGGEST)
);

// defer focus to prevent '/' key from being typed
const searchBoxEl = shallowRef<typeof SearchBox | null>(null);
const deferFocus = (focus = true): void => {
  setTimeout((): void => {
    focus ? searchBoxEl.value?.focus() : searchBoxEl.value?.blur();
  }, 0);
};

const deferShow = (): void => {
  setTimeout((): void => {
    show.value = true;
  }, 0);
};

const close = (focus?: boolean): void => {
  show.value = false;
  if (focus != null) {
    deferFocus(focus);
  }
};
</script>

<template>
  <div
    class=":uno: relative w-full max-h-full rounded-2 flex flex-col gap-y-4"
    :class="large && ':uno: text-xl'"
    v-focus-by-key
  >
    <SearchBox
      ref="searchBoxEl"
      :class="[
        'tabbable tabbable-skip',
        ':uno: w-full',
        large && ':uno: py-0.5',
      ]"
      v-model="term"
      focused
      :loading="!!term && loadingOrWaiting"
      @keydown.arrow-down="deferShow"
      @keydown.arrow-up="deferShow"
      @keydown.escape.stop="term ? (term = '') : close(show)"
      @keydown.enter.stop="close(false), emit('search', term)"
    />
    <ShortcutKeyHandler @press="deferFocus()" />
    <template v-if="!!results.length && show">
      <div
        class=":uno: z-1 absolute w-full border overflow-auto text-base bg-[--theme-bg] border-[--theme-divider] py-2 rounded-2 leading-tight"
        :class="large ? ':uno: top-14' : ':uno: top-10'"
      >
        <ul
          class=":uno: flex flex-col text-[--theme-text-light]"
          translate="no"
          v-on-click-outside="() => close(false)"
          @keydown.escape.prevent.stop="close(true)"
        >
          <template v-for="result in resultsSliced" :key="result.item.name">
            <li class=":uno: block">
              <a
                :href="getPortPageURL(result.item.name)"
                :class="[
                  'tabbable',
                  ':uno: block pl-12 py-2 color-[--theme-text-accent] hover:bg-[--theme-bg-accent] focus:bg-[--theme-bg-accent] !transition-colors-200 !outline-none',
                ]"
                tabindex="0"
              >
                <HighlightMatched
                  :text="result.item.name"
                  :indices="
                    result.matches?.find((m) => m.key === 'name')?.indices ?? []
                  "
                  highlight-class=":uno: font-bold"
                />
              </a>
            </li>
          </template>
        </ul>
      </div>
    </template>
  </div>
</template>
