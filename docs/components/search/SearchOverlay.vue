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
  <Transition
    enter-from-class=":uno: opacity-0"
    leave-to-class=":uno: opacity-0"
  >
    <div
      v-if="show"
      class=":uno: z-9999 fixed left-0 top-0 right-0 bottom-0 w-full h-full transition-opacity-200"
      @keydown.escape="close"
    >
      <div
        class=":uno: -z-1 absolute left-0 top-0 w-full h-full bg-[--theme-text] opacity-15"
      ></div>
      <div
        class=":uno: w-full h-full mx-auto flex flex-col items-center justify-center"
        @click="close"
      >
        <div class=":uno: w-full max-w-160 h-full pt-10 lg:pt-20">
          <SearchPopup v-model="term" @close="close" />
        </div>
      </div>
    </div>
  </Transition>
</template>
