<script lang="ts" setup>
import { useFocus, useVModel } from "@vueuse/core";
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
    class="group border-theme-divider-strong bg-theme-surface text-theme-text-light focus-within:border-theme-focus hover:border-theme-text-accent flex min-h-11 w-full items-center gap-2.5 rounded-[0.85rem] border px-3.5 py-2 shadow-(--theme-shadow-sm) transition-[border-color,box-shadow,background-color] duration-150 focus-within:shadow-[0_0_0_4px_color-mix(in_srgb,var(--theme-focus)_18%,transparent)]"
    data-search-field
  >
    <span class="ml-0.5 block size-[1.25em] flex-none opacity-80">
      <IconSearch aria-hidden="true" />
    </span>
    <input
      ref="inputEl"
      v-model="modelValue"
      class="placeholder:text-theme-text-muted w-full min-w-0 flex-1 border-0 bg-transparent font-[inherit] text-inherit outline-none! [&::-webkit-search-cancel-button]:hidden"
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
