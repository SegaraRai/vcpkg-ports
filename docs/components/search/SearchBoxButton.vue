<script lang="ts" setup>
import IconSearch from "~icons/line-md/search";
</script>

<template>
  <button
    type="button"
    class="text-theme-navbar-muted hover:text-theme-navbar-text @max-search-trigger/search-trigger:justify-center @max-search-trigger/search-trigger:px-2.5 flex min-h-10 w-full items-center gap-2.5 rounded-[0.85rem] border border-(--theme-navbar-text)/20 bg-(--theme-navbar-text)/10 px-3.5 py-2 shadow-none transition-[border-color,background-color,color] duration-150 select-none hover:border-(--theme-navbar-text)/40 hover:bg-(--theme-navbar-text)/15 focus-visible:border-(--theme-navbar-text)/40"
    aria-label="Search"
    translate="no"
  >
    <span class="ml-0.5 block size-[1.25em] flex-none opacity-80">
      <IconSearch aria-hidden="true" />
    </span>
    <span class="flex-1"></span>
    <span
      class="@max-search-trigger/search-trigger:hidden inline-flex items-center gap-1 rounded-md border border-current px-1.5 py-1 text-[0.72rem] leading-none opacity-75"
    >
      <kbd>/</kbd>
    </span>
    <span
      class="@max-search-trigger/search-trigger:hidden inline-flex items-center gap-1 rounded-md border border-current px-1.5 py-1 text-[0.72rem] leading-none opacity-75"
    >
      <kbd>
        <span class="not-kbd-mac:hidden">⌘ + K</span>
        <span class="not-kbd-ctrl:hidden">Ctrl + K</span>
      </kbd>
    </span>
  </button>
</template>
