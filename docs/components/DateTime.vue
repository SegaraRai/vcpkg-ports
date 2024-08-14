<script lang="ts" setup>
import {
  type MaybeRef,
  computedEager,
  useMounted,
  useTimeAgo,
} from "@vueuse/core";
import { type Ref, ref, unref } from "vue";

const props = defineProps<{
  timestamp: string;
  long?: boolean;
}>();

const useTernaryEager = <T, F>(
  condition: Readonly<MaybeRef<boolean>>,
  truthy: Readonly<MaybeRef<T>>,
  falsy: Readonly<MaybeRef<F>>
): Readonly<Ref<T | F>> =>
  computedEager(
    (): Readonly<T | F> => (unref(condition) ? unref(truthy) : unref(falsy))
  );

const mounted = useMounted();
const timestamp = computedEager((): string => props.timestamp);
const localTime = computedEager((): string =>
  new Date(timestamp.value).toLocaleString()
);
const timeAgo = useTimeAgo(timestamp);
const text = useTernaryEager(
  mounted,
  timeAgo,
  computedEager((): string => timestamp.value.replace(/T.+/, ""))
);
const textLong = useTernaryEager(
  computedEager((): boolean => mounted.value && !!props.long),
  computedEager((): string => `(${localTime.value})`),
  ref("")
);
const title = useTernaryEager(mounted, localTime, timestamp);
</script>

<template>
  <time
    :class="[':uno: whitespace-nowrap']"
    :dateTime="timestamp"
    :title="title"
    v-text="text"
  />
  <template v-if="textLong">
    <time
      class=":uno: whitespace-nowrap lt-sm:hidden ml-2 opacity-60 text-sm !leading-tight"
      :dateTime="timestamp"
      :title="title"
      v-text="textLong"
    />
  </template>
</template>
