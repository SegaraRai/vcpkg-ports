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
    class="w-full flex flex-row items-center gap-x-2 px-3 py-1.5 rounded-full border-[1.25px] transition-colors"
    :class="[wrapperClass, wrapperClassEx]"
  >
    <span class="flex-none block opacity-80 size-[1.25em] ml-0.5">
      <IconSearch aria-hidden="true" />
    </span>
    <input
      ref="inputEl"
      v-model="modelValue"
      class="flex-1 block w-full h-full !bg-transparent !outline-none"
      type="search"
      aria-label="Search"
      v-bind="$attrs"
    />
    <IconLoading
      class="flex-none block opacity-80 size-[1.25em] mr-0.5 transition-all duration-250"
      :class="(!mounted || !loading) && '!opacity-0'"
      aria-hidden="true"
    />
  </label>
</template>
