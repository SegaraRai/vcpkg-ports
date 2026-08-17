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
    class="block !w-8 !h-8 p-1.5 rounded-full transition-colors duration-200 bg-white/0 hover:bg-white/20 select-none"
  >
    <button
      class="block !w-full !h-full light:text-gray-600 icon-[lucide--moon] dark:icon-[lucide--sun]"
      :title="
        mounted
          ? `Switch to ${isDark ? 'light' : 'dark'} theme`
          : 'Switch theme'
      "
      @click="toggleDark()"
    ></button>
  </div>
</template>
