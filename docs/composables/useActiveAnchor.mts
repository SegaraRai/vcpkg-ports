import {
  computedWithControl,
  useElementSize,
  useEventListener,
  useMounted,
  useWindowScroll,
} from '@vueuse/core';
import type { MarkdownHeading } from 'astro';
import { Ref, computed, ref, watchEffect } from 'vue';
import { OFFSET_FOR_ACTIVE_ANCHOR } from '../constants.mjs';

export function useActiveAnchor(
  headings: Readonly<Ref<MarkdownHeading[]>>
): Readonly<Ref<string | null>> {
  if (import.meta.env.SSR || typeof window === 'undefined') {
    return ref(null);
  }

  const mounted = useMounted();
  const { height } = useElementSize(
    computed(() => (mounted.value ? document.body : null))
  );
  const headingWithOffset = computedWithControl(
    () => mounted.value && height.value,
    () => {
      if (!mounted.value) {
        return [];
      }
      return headings.value.map((h) => ({
        ...h,
        offset: document.getElementById(h.slug)?.offsetTop || 0,
      }));
    }
  );

  const activeAnchor = ref<string | null>(null);

  const { y } = useWindowScroll();
  const getActiveAnchor = (): string | undefined => {
    if (!mounted.value) {
      return;
    }

    // bottom?
    if (y.value >= document.body.offsetHeight - window.innerHeight - 1) {
      return headingWithOffset.value[headingWithOffset.value.length - 1].slug;
    }

    for (let i = headingWithOffset.value.length - 1; i >= 0; i--) {
      const h = headingWithOffset.value[i];
      if (y.value >= h.offset + OFFSET_FOR_ACTIVE_ANCHOR) {
        return h.slug;
      }
    }

    // top
    return headingWithOffset.value[0]?.slug;
  };

  const updateActiveAnchor = (): void => {
    activeAnchor.value = getActiveAnchor() || null;
  };

  watchEffect(updateActiveAnchor);
  useEventListener('resize', updateActiveAnchor);

  return activeAnchor;
}
