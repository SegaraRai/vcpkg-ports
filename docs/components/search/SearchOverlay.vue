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
      class="fixed top-0 right-0 bottom-0 left-0 z-9999 h-full w-full transition-opacity duration-200"
      @keydown.escape="close"
    >
      <div
        class="absolute top-0 left-0 -z-1 h-full w-full bg-(--theme-text) opacity-15"
      ></div>
      <div
        class="mx-auto flex h-full w-full flex-col items-center justify-center"
        @click="close"
      >
        <div class="h-full w-full max-w-160 pt-10 lg:pt-20">
          <SearchPopup v-model="term" @close="close" />
        </div>
      </div>
    </div>
  </Transition>
</template>
