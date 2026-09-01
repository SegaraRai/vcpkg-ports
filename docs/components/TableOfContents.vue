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
  <div>
    <h2 class="sidebar-heading">On this page</h2>
    <ul class="m-0 grid list-none gap-1 p-0">
      <template v-for="heading in headings2" :key="heading.slug">
        <li
          class="group/toc-item data-[active=true]:border-theme-text-accent border-l-2 border-transparent pl-3"
          :data-active="props.highlight && activeAnchor === heading.slug"
        >
          <a
            class="text-theme-text-light hover:bg-theme-bg-accent hover:text-theme-text focus-visible:bg-theme-bg-accent focus-visible:text-theme-text group-data-[active=true]/toc-item:text-theme-text block rounded-md px-2 py-1 text-sm no-underline"
            :href="`#${heading.slug}`"
            v-text="heading.text"
          />
        </li>
      </template>
    </ul>
  </div>
</template>
