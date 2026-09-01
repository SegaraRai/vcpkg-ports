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
    class="text-theme-navbar-muted hover:text-theme-navbar-text flex min-h-10 w-full items-center gap-2.5 rounded-[0.85rem] border border-(--theme-navbar-text)/20 bg-(--theme-navbar-text)/10 px-3.5 py-2 shadow-none transition-[border-color,background-color,color] duration-150 select-none hover:border-(--theme-navbar-text)/40 hover:bg-(--theme-navbar-text)/15 focus-visible:border-(--theme-navbar-text)/40 max-[639px]:justify-center max-[639px]:px-2.5"
    aria-label="Search"
    translate="no"
  >
    <span class="ml-0.5 block size-[1.25em] flex-none opacity-80">
      <IconSearch aria-hidden="true" />
    </span>
    <span class="flex-1"></span>
    <span
      class="inline-flex items-center gap-1 rounded-md border border-current px-1.5 py-1 text-[0.72rem] leading-none opacity-75 max-[639px]:hidden"
    >
      <kbd>/</kbd>
    </span>
    <span
      class="inline-flex items-center gap-1 rounded-md border border-current px-1.5 py-1 text-[0.72rem] leading-none opacity-75 max-[639px]:hidden"
    >
      <kbd v-text="`${modifier} K`" />
    </span>
  </button>
</template>
