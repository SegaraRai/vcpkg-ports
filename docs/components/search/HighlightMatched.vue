<script lang="ts" setup>
import { computed } from "vue";

const props = defineProps<{
  text: string;
  indices: readonly (readonly [begin: number, end: number])[];
}>();

const chunks = computed(() => {
  const { text, indices } = props;
  const result: (readonly [text: string, highlight: boolean])[] = [];
  let offset = 0;
  for (const [begin, end] of indices) {
    if (begin > offset) {
      result.push([text.slice(offset, begin), false]);
    }
    result.push([text.slice(begin, end + 1), true]);
    offset = end + 1;
  }
  if (offset < text.length) {
    result.push([text.slice(offset), false]);
  }
  return result;
});
</script>

<template>
  <template v-for="([chunk, highlight], _index) in chunks" :key="_index">
    <span :data-highlight="highlight" v-text="chunk" />
  </template>
</template>
