<script lang="ts" setup>
import { computedEager, useFocus, useVModel } from '@vueuse/core';
import { defineComponent, onMounted, ref } from 'vue';
import IconSearch from '~icons/line-md/search';

const props = defineProps<{
  modelValue: string;
  focused?: boolean;
  loading?: boolean;
  wrapperClass?: any;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'focus', value: FocusEvent): void;
}>();

const modelValue = useVModel(props, 'modelValue', emit);

const inputEl = ref<HTMLInputElement | null>(null);
const { focused } = useFocus(inputEl);

const wrapperClassEx = computedEager(() =>
  focused.value
    ? ':uno: light:border-orange-500/70 light:bg-black/1 dark:border-orange-400/70 dark:bg-white/5'
    : ':uno: light:border-black/20 light:hover:border-orange-500/70 light:bg-black/0 light:hover:bg-black/1 dark:border-white/50 dark:hover:border-orange-400/70 dark:bg-white/2 dark:hover:bg-white/5'
);

defineExpose({
  focus: (): void => {
    focused.value = true;
  },
});

onMounted((): void => {
  if (props.focused) {
    setTimeout((): void => {
      focused.value = true;
    }, 0);
  }
});
</script>

<script lang="ts">
export default defineComponent({
  inheritAttrs: false,
});
</script>

<template>
  <label
    class=":uno: w-full flex flex-row items-center gap-x-2 px-3 py-1.5 rounded-full border-1.25 transition-colors"
    :class="[wrapperClass, wrapperClassEx]"
  >
    <span class=":uno: flex-none block opacity-80 w-1.25em h-1.25em ml-0.5">
      <IconSearch />
    </span>
    <input
      class=":uno: flex-1 block w-full h-full !bg-transparent !outline-none"
      type="text"
      ref="inputEl"
      v-model="modelValue"
      v-bind="$attrs"
    />
    <span
      class=":uno: flex-none block opacity-80 w-1.25em h-1.25em mr-0.5 i-line-md-loading-loop transition-all-250"
      :class="!loading && ':uno: !opacity-0'"
    ></span>
  </label>
</template>
