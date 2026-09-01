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
  <div class="select-none">
    <button
      type="button"
      class="text-theme-navbar-text! hover:bg-theme-bg-accent hover:text-theme-text-accent! inline-flex size-10! items-center justify-center rounded-xl border-0 bg-transparent transition-[background-color,color,transform] duration-150 active:scale-95 max-sm:size-9!"
      :title="
        mounted
          ? `Switch to ${isDark ? 'light' : 'dark'} theme`
          : 'Switch theme'
      "
      @click="toggleDark()"
    >
      <span
        class="icon-[lucide--moon] dark:icon-[lucide--sun] block size-5"
        aria-hidden="true"
      ></span>
    </button>
  </div>
</template>
