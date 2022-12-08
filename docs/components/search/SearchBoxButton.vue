<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import IconSearch from '~icons/line-md/search';

// meta key detect
// https://github.com/vuejs/vitepress/blob/v1.0.0-alpha.29/src/client/theme-default/components/VPNavBarSearch.vue#L24-L27
const modifier = ref('Ctrl');
onMounted((): void => {
  if (
    !import.meta.env.SSR &&
    typeof navigator !== 'undefined' &&
    /Mac|iPhone|iPod|iPad/i.test(navigator.platform)
  ) {
    modifier.value = '⌘';
  }
});
</script>

<template>
  <button
    class=":uno: select-none w-full flex flex-row items-center gap-x-2 px-3 py-1.5 rounded-full border-1.25 transition-colors text-[var(--theme-text-light)] light:border-black/30 dark:border-white/50 light:hover:border-black/45 dark:hover:border-orange-400/70 light:bg-white/1 dark:bg-white/2 light:hover:bg-white/10 dark:hover:bg-white/5"
    aria-label="Search"
    translate="no"
  >
    <span class=":uno: flex-none block opacity-80 w-1.25em h-1.25em ml-0.5">
      <IconSearch />
    </span>
    <span class=":uno: flex-1"></span>
    <span
      class=":uno: border border-color-[var(--theme-divider)] rounded-sm px-2 py-1 text-sm leading-none"
    >
      <kbd>/</kbd>
    </span>
    <span
      class=":uno: border border-color-[var(--theme-divider)] rounded-sm px-2 py-1 text-sm leading-none lt-sm:hidden"
    >
      <kbd v-text="`${modifier} K`" />
    </span>
  </button>
</template>
