<script lang="ts" setup>
import { useMounted, useTimeAgo } from "@vueuse/core";
import { type MaybeRef, type Ref, computed, ref, unref } from "vue";

const props = defineProps<{
  timestamp: string;
  long?: boolean;
  itemProp?: "datePublished" | "dateModified";
}>();

const useTernaryEager = <T, F>(
  condition: Readonly<MaybeRef<boolean>>,
  truthy: Readonly<MaybeRef<T>>,
  falsy: Readonly<MaybeRef<F>>
): Readonly<Ref<T | F>> =>
  computed((): Readonly<T | F> =>
    unref(condition) ? unref(truthy) : unref(falsy)
  );

const mounted = useMounted();
const timestamp = computed((): string => props.timestamp);
const localTime = computed((): string =>
  new Date(timestamp.value).toLocaleString()
);
const timeAgo = useTimeAgo(timestamp);
const text = useTernaryEager(
  mounted,
  timeAgo,
  computed((): string => timestamp.value.replace(/T.+/, ""))
);
const textLong = useTernaryEager(
  computed((): boolean => mounted.value && !!props.long),
  computed((): string => `(${localTime.value})`),
  ref("")
);
const title = useTernaryEager(mounted, localTime, timestamp);
</script>

<template>
  <time
    :class="[':uno: whitespace-nowrap']"
    :dateTime="timestamp"
    :title="title"
    :itemprop="props.itemProp"
    :content="props.itemProp ? timestamp : undefined"
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
