<script lang="ts" setup>
import { Ref, ref, unref } from 'vue';
import { MaybeRef, useMounted, useTimeAgo, computedEager } from '@vueuse/core';

const props = defineProps<{
  timestamp: string;
  long?: boolean | false;
}>();

const useTernaryEager = <T, F>(
  condition: Readonly<MaybeRef<boolean>>,
  truthy: Readonly<MaybeRef<T>>,
  falsy: Readonly<MaybeRef<F>>
): Readonly<Ref<T | F>> =>
  computedEager(() => (unref(condition) ? unref(truthy) : unref(falsy)));

const mounted = useMounted();
const timestamp = computedEager(() => props.timestamp);
const localTime = computedEager(() =>
  new Date(timestamp.value).toLocaleString()
);
const timeAgo = useTimeAgo(timestamp);
const text = useTernaryEager(
  mounted,
  timeAgo,
  computedEager(() => timestamp.value.replace(/T.+/, ''))
);
const textLong = useTernaryEager(
  computedEager(() => mounted.value && !!props.long),
  computedEager(() => `(${localTime.value})`),
  ref('')
);
const title = useTernaryEager(mounted, localTime, timestamp);
</script>

<template>
  <time
    :class="[':uno: whitespace-nowrap']"
    :dateTime="timestamp"
    :title="title"
    v-text="text"
  ></time>
  <template v-if="textLong">
    <time
      class=":uno: whitespace-nowrap lt-sm:hidden ml-2 opacity-60 text-sm !leading-tight"
      :dateTime="timestamp"
      :title="title"
      v-text="textLong"
    ></time>
  </template>
</template>
