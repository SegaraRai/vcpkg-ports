import { computedEager } from '@vueuse/core';
import type Fuse from 'fuse.js';
import { Ref, computed, shallowRef } from 'vue';
import type { DataSearchItem } from '../../shared/dataTypes/searchItem.mjs';
import { pickRandom } from '../../shared/utils.mjs';
import { SEARCH_RANDOM_MAX_RESULTS } from '../constants.mjs';

async function createFuseAsync(nameOnly: boolean) {
  const [{ default: Fuse }, { default: searchItems }] = await Promise.all([
    import('fuse.js'),
    import('../virtual/searchItems.mjs'),
  ]);

  const fuse = new Fuse(searchItems, {
    keys: [
      {
        name: 'name',
        weight: 1,
      },
      ...(nameOnly
        ? []
        : [
            {
              name: 'description',
              weight: 0.75,
            },
            {
              name: 'url',
              weight: 0.25,
            },
          ]),
    ],
    threshold: 0.25,
    isCaseSensitive: false,
    includeMatches: true,
    includeScore: true,
    shouldSort: true,
    ignoreLocation: true,
  });

  const toFuseResult = (
    item: DataSearchItem
  ): Fuse.FuseResult<DataSearchItem> => ({
    item,
    refIndex: -1,
    matches: [],
    score: 0,
  });

  return {
    search: (query: string): Fuse.FuseResult<DataSearchItem>[] => {
      if (!query) {
        return [];
      }
      if (/^\s*=\s*RAND\s*\(\s*\)\s*;*\s*$/i.test(query)) {
        return pickRandom(searchItems, SEARCH_RANDOM_MAX_RESULTS).map(
          toFuseResult
        );
      }
      return fuse.search<DataSearchItem>(query);
    },
  };
}

type FuseInstance = Awaited<ReturnType<typeof createFuseAsync>>;

const gFusePromiseMap = new Map<boolean, Promise<FuseInstance>>();
function loadFuse(nameOnly: boolean): Promise<FuseInstance> {
  let instance = gFusePromiseMap.get(nameOnly);
  if (!instance) {
    instance = createFuseAsync(nameOnly);
    gFusePromiseMap.set(nameOnly, instance);
  }
  return instance;
}

export function useSearch(
  query: Readonly<Ref<string | null | undefined>>,
  nameOnly = false,
  eager = false
) {
  const fuse = shallowRef<FuseInstance | undefined>();
  if (eager) {
    loadFuse(nameOnly);
  }
  gFusePromiseMap.get(nameOnly)?.then((f): void => {
    fuse.value = f;
  });

  return {
    loading: computedEager((): boolean => !fuse.value),
    results: computed(
      (): Fuse.FuseResult<DataSearchItem>[] =>
        (query.value?.trim() && fuse.value?.search(query.value.trim())) || []
    ),
    load: async (): Promise<void> => {
      if (fuse.value || gFusePromiseMap.has(nameOnly)) {
        return;
      }
      if (import.meta.env.SSR) {
        // eslint-disable-next-line no-console
        console.info('Skip loading fuse.js in SSR/SSG');
        return;
      }
      fuse.value = await loadFuse(nameOnly);
    },
  };
}
