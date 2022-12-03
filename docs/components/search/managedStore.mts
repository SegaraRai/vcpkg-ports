import { Ref, ref } from 'vue';

// we want to use provide/inject but it seems to be not working with Astro

const SYM_SEARCH_SHOW = Symbol('search:show');
const SYM_SEARCH_TERM = Symbol('search:term');

declare global {
  interface Window {
    [SYM_SEARCH_SHOW]?: Ref<boolean>;
    [SYM_SEARCH_TERM]?: Ref<string>;
  }
}

export function useSearchShow(): Ref<boolean> {
  if (import.meta.env.SSR || typeof window === 'undefined') {
    return ref(false);
  }
  return (window[SYM_SEARCH_SHOW] ||= ref(false));
}

export function useSearchTerm(): Ref<string> {
  if (import.meta.env.SSR || typeof window === 'undefined') {
    return ref('');
  }
  return (window[SYM_SEARCH_TERM] ||= ref(''));
}
