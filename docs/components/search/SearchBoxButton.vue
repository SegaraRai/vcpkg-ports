<script lang="ts" setup>
import { onMounted, ref } from "vue";
import IconSearch from "~icons/line-md/search";

// meta key detect
// https://github.com/vuejs/vitepress/blob/v1.0.0-alpha.29/src/client/theme-default/components/VPNavBarSearch.vue#L24-L27
const modifier = ref("Ctrl");
onMounted((): void => {
  const browserNavigator = navigator as Navigator & {
    userAgentData?: {
      platform?: string;
    };
  };
  if (
    !import.meta.env.SSR &&
    /Mac|iPhone|iPod|iPad/i.test(
      browserNavigator.userAgentData?.platform ||
        browserNavigator.platform ||
        ""
    )
  ) {
    modifier.value = "⌘";
  }
});
</script>

<template>
  <button
    type="button"
    class="light:border-black/30 light:hover:border-black/45 light:bg-white/1 light:hover:bg-white/10 flex w-full flex-row items-center gap-x-2 rounded-full border-[1.25px] px-3 py-1.5 text-(--theme-text-light) transition-colors select-none dark:border-white/50 dark:bg-white/2 dark:hover:border-orange-400/70 dark:hover:bg-white/5"
    aria-label="Search"
    translate="no"
  >
    <span class="ml-0.5 block size-[1.25em] flex-none opacity-80">
      <IconSearch aria-hidden="true" />
    </span>
    <span class="flex-1"></span>
    <span
      class="rounded-sm border border-(--theme-divider) px-2 py-1 text-sm leading-none"
    >
      <kbd>/</kbd>
    </span>
    <span
      class="rounded-sm border border-(--theme-divider) px-2 py-1 text-sm leading-none max-sm:hidden"
    >
      <kbd v-text="`${modifier} K`" />
    </span>
  </button>
</template>
