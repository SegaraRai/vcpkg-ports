<script lang="ts" setup>
import { vOnClickOutside } from "@vueuse/components";
import { computedEager, useDebounce, useVModel } from "@vueuse/core";
import { nextTick, onMounted, ref, shallowRef, watch, watchEffect } from "vue";
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

const props = withDefaults(
  defineProps<{
    modelValue: string;
    autoFocus?: boolean;
    large?: boolean;
    placeholder?: string;
  }>(),
  { autoFocus: true, placeholder: undefined }
);

const emit = defineEmits<{
  (e: "update:modelValue" | "search", value: string): void;
}>();

const term = useVModel(props, "modelValue", emit);
const show = ref(false);
const containerEl = shallowRef<HTMLElement | null>(null);
const suggestionsStyle = ref<Record<string, string>>({});

const termDebounced = useDebounce(term, SEARCH_TERM_DEBOUNCE);
const { load, loading, results } = useSearch(termDebounced, true);
const loadingOrWaiting = computedEager(
  (): boolean => loading.value || termDebounced.value !== term.value
);

// Lazy-load the search index and runtime.
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

const updateSuggestionsPosition = (): void => {
  if (!containerEl.value || !show.value || typeof window === "undefined") {
    return;
  }

  const field = containerEl.value.querySelector<HTMLElement>(
    "[data-search-field]"
  );
  if (!field) {
    return;
  }

  const rect = field.getBoundingClientRect();
  const bottomSpace = window.innerHeight - rect.bottom - 16;
  const topSpace = rect.top - 16;
  const shouldOpenAbove = bottomSpace < 240 && topSpace > bottomSpace;

  if (shouldOpenAbove) {
    suggestionsStyle.value = {
      position: "fixed",
      top: "auto",
      right: "auto",
      bottom: "0.75rem",
      left: `${rect.left}px`,
      width: `${rect.width}px`,
      maxHeight: `${Math.min(288, Math.max(160, topSpace))}px`,
    };
  } else {
    suggestionsStyle.value = {
      position: "absolute",
      top: `${rect.height + 8}px`,
      right: "auto",
      bottom: "auto",
      left: "0",
      width: "100%",
      maxHeight: `${Math.min(320, Math.max(160, bottomSpace))}px`,
    };
  }
};

watch(show, (value): void => {
  if (value) {
    void nextTick(updateSuggestionsPosition);
  }
});

onMounted((): (() => void) => {
  const update = (): void => updateSuggestionsPosition();
  window.addEventListener("resize", update);
  window.addEventListener("scroll", update, true);

  return (): void => {
    window.removeEventListener("resize", update);
    window.removeEventListener("scroll", update, true);
  };
});
</script>

<template>
  <div
    ref="containerEl"
    v-focus-by-key
    class="group/sbs relative flex max-h-full w-full flex-col gap-y-4 rounded-lg data-[size=large]:text-xl"
    :data-size="large ? 'large' : 'normal'"
  >
    <SearchBox
      ref="searchBoxEl"
      v-model="term"
      class="w-full group-data-[size=large]/sbs:py-0.5"
      data-tabbable
      :focused="props.autoFocus"
      :loading="!!term && loadingOrWaiting"
      :placeholder="props.placeholder"
      @keydown.arrow-down="deferShow"
      @keydown.arrow-up="deferShow"
      @keydown.escape.stop="term ? (term = '') : close(show)"
      @keydown.enter.prevent.stop="(close(false), emit('search', term))"
    />
    <ShortcutKeyHandler @press="deferFocus()" />
    <template v-if="!!results.length && show">
      <div
        class="border-theme-divider-strong bg-theme-surface-raised absolute top-[calc(100%+0.5rem)] left-0 z-20 max-h-[min(24rem,calc(100dvh-6rem))] w-full overflow-y-auto overscroll-contain rounded-[0.85rem] border p-1 text-base leading-tight shadow-(--theme-shadow-md)"
        :style="suggestionsStyle"
      >
        <ul
          v-on-click-outside="() => close(false)"
          class="text-theme-text-light m-0 flex list-none flex-col p-0"
          translate="no"
          @keydown.escape.prevent.stop="close(true)"
        >
          <template v-for="result in resultsSliced" :key="result.item.name">
            <li class="block **:data-[highlight=true]:font-bold">
              <a
                :href="getPortPageURL(result.item.name)"
                class="text-theme-text hover:bg-theme-bg-accent hover:text-theme-text focus:bg-theme-bg-accent focus:text-theme-text block px-4 py-3 no-underline transition-[color,background-color] duration-150 outline-none!"
                data-tabbable
                tabindex="0"
              >
                <HighlightMatched
                  :text="result.item.name"
                  :indices="
                    result.matches?.find((m) => m.key === 'name')?.indices ?? []
                  "
                />
              </a>
            </li>
          </template>
        </ul>
      </div>
    </template>
  </div>
</template>
