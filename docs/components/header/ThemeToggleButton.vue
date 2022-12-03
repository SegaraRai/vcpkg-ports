<script lang="ts" setup>
import { useDark, useToggle } from '@vueuse/core';

const isDark = useDark({
  storageKey: 'theme',
  valueDark: 'theme-dark',
  valueLight: 'theme-light',
});
const toggleDark = useToggle(isDark);
</script>

<template>
  <div
    class=":uno: block !w-8 !h-8 p-1.5 rounded-full transition-colors-200 !bg-opacity-0 hover:!bg-opacity-20 bg-white"
  >
    <button
      class=":uno: block !w-full !h-full light:text-true-gray-600 i-lucide-moon dark:i-lucide-sun"
      :title="`Switch to ${isDark ? 'light' : 'dark'} theme`"
      @click="toggleDark()"
    ></button>
  </div>
</template>
