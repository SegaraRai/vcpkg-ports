<script lang="ts" setup>
import { computedEager, useFocus, useVModel } from "@vueuse/core";
import { defineComponent, onMounted, ref, shallowRef } from "vue";
import IconSearch from "~icons/line-md/search";
import IconLoading from "~icons/line-md/loading-loop";

const props = defineProps<{
  modelValue: string;
  focused?: boolean;
  loading?: boolean;
  // oxlint-disable-next-line @typescript-eslint/no-explicit-any
  wrapperClass?: any;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
  (e: "focus", value: FocusEvent): void;
}>();

const modelValue = useVModel(props, "modelValue", emit);
const mounted = ref(false);

const inputEl = shallowRef<HTMLInputElement | null>(null);
const { focused: inputFocused } = useFocus(inputEl);

const wrapperClassEx = computedEager((): string =>
  inputFocused.value
    ? "light:border-orange-500/70 light:bg-black/[0.01] dark:border-orange-400/70 dark:bg-white/5"
    : "light:border-black/20 light:hover:border-orange-500/70 light:bg-black/0 light:hover:bg-black/[0.01] dark:border-white/50 dark:hover:border-orange-400/70 dark:bg-white/[0.02] dark:hover:bg-white/5"
);

defineExpose({
  blur: (): void => {
    inputFocused.value = false;
  },
  focus: (): void => {
    inputFocused.value = true;
  },
});

onMounted((): void => {
  if (props.focused) {
    setTimeout((): void => {
      inputFocused.value = true;
    }, 0);
  }
  mounted.value = true;
});
</script>

<script lang="ts">
export default defineComponent({
  inheritAttrs: false,
});
</script>

<template>
  <label
    class="flex w-full flex-row items-center gap-x-2 rounded-full border-[1.25px] px-3 py-1.5 transition-colors"
    :class="[wrapperClass, wrapperClassEx]"
  >
    <span class="ml-0.5 block size-[1.25em] flex-none opacity-80">
      <IconSearch aria-hidden="true" />
    </span>
    <input
      ref="inputEl"
      v-model="modelValue"
      class="block h-full w-full flex-1 bg-transparent! outline-none!"
      type="search"
      aria-label="Search"
      v-bind="$attrs"
    />
    <IconLoading
      class="mr-0.5 block size-[1.25em] flex-none opacity-80 transition-all duration-250 data-[loaded=true]:opacity-0"
      aria-hidden="true"
      :data-loaded="!mounted || !loading"
    />
  </label>
</template>
