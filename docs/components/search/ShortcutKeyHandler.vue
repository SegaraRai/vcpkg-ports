<script lang="ts" setup>
import { useActiveElement, useMagicKeys } from '@vueuse/core';
import { computed, watchEffect } from 'vue';

const emit = defineEmits<{
  (e: 'press'): void;
}>();

const activeElement = useActiveElement();
const notUsingInput = computed(
  () =>
    activeElement.value?.tagName !== 'INPUT' &&
    activeElement.value?.tagName !== 'TEXTAREA'
);

const { slash, ctrl_k } = useMagicKeys({
  passive: false,
  onEventFired(e): void {
    if (e.type === 'keydown' && e.ctrlKey && e.key === 'k') {
      e.preventDefault();
    }
  },
});
watchEffect(() => {
  if ((slash.value || ctrl_k.value) && notUsingInput.value) {
    emit('press');
  }
});
</script>
