<script lang="ts" setup>
import { useDark, useToggle } from "@vueuse/core";
import { onMounted, ref } from "vue";

const mounted = ref(false);

const isDark = useDark({
  storageKey: "theme",
  valueDark: "theme-dark",
  valueLight: "theme-light",
});
const toggleDark = useToggle(isDark);

onMounted((): void => {
  mounted.value = true;
});
</script>

<template>
  <div
    class="block !h-8 !w-8 rounded-full bg-white/0 p-1.5 transition-colors duration-200 select-none hover:bg-white/20"
  >
    <button
      class="light:text-gray-600 icon-[lucide--moon] dark:icon-[lucide--sun] block !h-full !w-full"
      :title="
        mounted
          ? `Switch to ${isDark ? 'light' : 'dark'} theme`
          : 'Switch theme'
      "
      @click="toggleDark()"
    ></button>
  </div>
</template>
