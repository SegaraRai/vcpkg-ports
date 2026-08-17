<script lang="ts" setup>
import { vOnClickOutside } from "@vueuse/components";
import { computedEager, useDebounce, useVModel } from "@vueuse/core";
import { ref, shallowRef, watch, watchEffect } from "vue";
import { useSearch } from "../../composables/useSearch.mjs";
import {
  SEARCH_MAX_RESULTS_FOR_SUGGEST,
  SEARCH_TERM_DEBOUNCE,
  getPortPageURL,
} from "../../constants.mjs";
import { vFocusByKey } from "../../directives/vFocusByKey.mjs";
import HighlightMatched from "./HighlightMatched.vue";
import SearchBox from "./SearchBox.vue";
import ShortcutKeyHandler from "./ShortcutKeyHandler.vue";

const props = defineProps<{
  modelValue: string;
  large?: boolean;
}>();

const emit = defineEmits<{
  (e: "update:modelValue" | "search", value: string): void;
}>();

const term = useVModel(props, "modelValue", emit);
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
    if (focus) {
      searchBoxEl.value?.focus();
    } else {
      searchBoxEl.value?.blur();
    }
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
    v-focus-by-key
    class="group/sbs relative flex max-h-full w-full flex-col gap-y-4 rounded-lg data-[size=large]:text-xl"
    :data-size="large ? 'large' : 'normal'"
  >
    <SearchBox
      ref="searchBoxEl"
      v-model="term"
      class="tabbable tabbable-skip w-full group-data-[size=large]/sbs:py-0.5"
      focused
      :loading="!!term && loadingOrWaiting"
      @keydown.arrow-down="deferShow"
      @keydown.arrow-up="deferShow"
      @keydown.escape.stop="term ? (term = '') : close(show)"
      @keydown.enter.stop="(close(false), emit('search', term))"
    />
    <ShortcutKeyHandler @press="deferFocus()" />
    <template v-if="!!results.length && show">
      <div
        class="absolute top-10 z-1 w-full overflow-auto rounded-lg border border-(--theme-divider) bg-(--theme-bg) py-2 text-base leading-tight group-data-[size=large]/sbs:top-14"
      >
        <ul
          v-on-click-outside="() => close(false)"
          class="flex flex-col text-(--theme-text-light)"
          translate="no"
          @keydown.escape.prevent.stop="close(true)"
        >
          <template v-for="result in resultsSliced" :key="result.item.name">
            <li class="block">
              <a
                :href="getPortPageURL(result.item.name)"
                class="tabbable block py-2 pl-12 text-(--theme-text-accent) transition-colors! duration-200! outline-none! hover:bg-(--theme-bg-accent) focus:bg-(--theme-bg-accent)"
                tabindex="0"
              >
                <HighlightMatched
                  :text="result.item.name"
                  :indices="
                    result.matches?.find((m) => m.key === 'name')?.indices ?? []
                  "
                  highlight-class="font-bold"
                />
              </a>
            </li>
          </template>
        </ul>
      </div>
    </template>
  </div>
</template>
