<script lang="ts" setup>
import { useMounted, useVModel } from "@vueuse/core";
import { watchEffect } from "vue";
import SearchPopup from "./SearchPopup.vue";

const props = defineProps<{
  modelValue: boolean;
  term: string;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "update:term", value: string): void;
}>();

const show = useVModel(props, "modelValue", emit);
const term = useVModel(props, "term", emit);

// close dialog
const close = (): void => {
  show.value = false;
};

// no-scroll
const mounted = useMounted();
watchEffect((): void => {
  if (import.meta.env.SSR) {
    return;
  }

  document.body.classList.toggle("no-scroll", mounted.value && show.value);
});
</script>

<template>
  <Transition enter-from-class="opacity-0" leave-to-class="opacity-0">
    <div
      v-if="show"
      class="bg-theme-overlay-backdrop @container/search-dialog fixed inset-0 z-9999 overflow-auto px-4 pt-[clamp(4.75rem,9vh,7rem)] pb-8 backdrop-blur-lg transition-opacity duration-200"
      @click="close"
      @keydown.escape="close"
    >
      <div
        class="@max-search-dialog/search-dialog:rounded-[0.85rem] @max-search-dialog/search-dialog:p-3 border-theme-divider-strong bg-theme-surface-raised mx-auto w-full max-w-2xl rounded-2xl border p-4 shadow-(--theme-shadow-overlay)"
        role="dialog"
        aria-modal="true"
        aria-label="Search ports"
        @click.stop
      >
        <SearchPopup v-model="term" @close="close" />
      </div>
    </div>
  </Transition>
</template>
