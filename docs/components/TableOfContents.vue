<script lang="ts" setup>
import type { MarkdownHeading } from "astro";
import { computed } from "vue";
import { useActiveAnchor } from "../composables/useActiveAnchor.mjs";

const props = defineProps<{
  headings: readonly MarkdownHeading[];
  highlight?: boolean;
}>();

const headings2 = computed<readonly MarkdownHeading[]>(() =>
  props.headings.filter((h) => h.depth === 2)
);
const activeAnchor = useActiveAnchor(headings2);
</script>

<template>
  <h2 class="heading">On this page</h2>
  <ul class="plain-list">
    <template v-for="heading in headings2" :key="heading.slug">
      <li
        class="header-link"
        :class="[
          `depth-${heading.depth}`,
          props.highlight && activeAnchor === heading.slug
            ? 'current-header-link'
            : '',
        ]"
      >
        <a :href="`#${heading.slug}`" v-text="heading.text" />
      </li>
    </template>
  </ul>
</template>
