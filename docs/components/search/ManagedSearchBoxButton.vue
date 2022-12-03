<script lang="ts" setup>
import SearchBoxButton from './SearchBoxButton.vue';
import { useSearchShow } from './managedStore.mjs';
import { useActiveElement, useMagicKeys } from '@vueuse/core';
import { computed, watchEffect } from 'vue';

const show = useSearchShow();

const showOverlay = () => {
  if (show) {
    show.value = true;
  }
};

const activeElement = useActiveElement();
const notUsingInput = computed(
  () =>
    activeElement.value?.tagName !== 'INPUT' &&
    activeElement.value?.tagName !== 'TEXTAREA'
);

const { slash, ctrl_k } = useMagicKeys({
  passive: false,
  onEventFired(e): void {
    if (e.ctrlKey && e.key === 'k' && e.type === 'keydown') {
      e.preventDefault();
    }
  },
});
watchEffect(() => {
  if (notUsingInput.value && (slash.value || ctrl_k.value)) {
    showOverlay();
  }
});
</script>

<template>
  <SearchBoxButton @click="showOverlay" />
</template>
