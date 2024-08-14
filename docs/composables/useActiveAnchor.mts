import {
  computedWithControl,
  useElementSize,
  useEventListener,
  useMounted,
  useWindowScroll,
} from "@vueuse/core";
import type { MarkdownHeading } from "astro";
import { type Ref, computed, ref, watchEffect } from "vue";
import { OFFSET_FOR_ACTIVE_ANCHOR } from "../constants.mjs";

export function useActiveAnchor(
  headings: Readonly<Ref<readonly MarkdownHeading[]>>
): Readonly<Ref<string | null>> {
  if (import.meta.env.SSR) {
    return ref(null);
  }

  const mounted = useMounted();
  // we have to observe body size because of <details> elements
  const { height } = useElementSize(
    computed((): HTMLElement | null => (mounted.value ? document.body : null))
  );
  const headingWithOffset = computedWithControl(
    (): unknown => mounted.value && height.value,
    (): readonly (MarkdownHeading & { readonly offset: number })[] => {
      if (!mounted.value) {
        return [];
      }
      return headings.value.map((h) => ({
        ...h,
        offset: document.getElementById(h.slug)?.offsetTop ?? 0,
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
  useEventListener("resize", updateActiveAnchor);

  return activeAnchor;
}
