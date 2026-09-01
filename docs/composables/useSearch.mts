import type { Index as LunrIndex } from "lunr";
import { type Ref, computed, shallowRef } from "vue";
import type {
  DataSearchItem,
  DataSearchMatch,
  DataSearchResult,
} from "../../shared/dataTypes/searchItem.mjs";
import { pickRandom } from "../../shared/utils.mjs";
import { SEARCH_RANDOM_MAX_RESULTS } from "../constants.mjs";

const SEARCHABLE_FIELDS = ["name", "description"] as const;

type Position = readonly [start: number, length: number];
type MatchMetadata = Readonly<
  Record<
    string,
    Partial<
      Record<
        (typeof SEARCHABLE_FIELDS)[number],
        { readonly position?: readonly Position[] }
      >
    >
  >
>;

function toSearchResult(
  result: LunrIndex.Result,
  item: DataSearchItem
): DataSearchResult {
  const metadata = result.matchData.metadata as MatchMetadata;
  const matches: DataSearchMatch[] = [];

  for (const field of SEARCHABLE_FIELDS) {
    const indices = Object.values(metadata)
      .flatMap((fields) => fields[field]?.position ?? [])
      .map(([start, length]) => [start, start + length - 1] as const)
      .sort(([left], [right]) => left - right);
    if (indices.length) {
      matches.push({ key: field, indices });
    }
  }

  return { item, matches, score: result.score };
}

function runQuery(
  lunr: typeof import("lunr"),
  index: LunrIndex,
  queryText: string,
  nameOnly: boolean,
  fuzzy: boolean
): LunrIndex.Result[] {
  const terms = lunr.tokenizer(queryText).map(String);
  const fields = nameOnly ? ["name"] : [...SEARCHABLE_FIELDS];
  return index.query((query): void => {
    for (const term of terms) {
      if (fuzzy) {
        query.term(term, {
          editDistance:
            term.length >= 4 ? Math.min(2, Math.ceil(term.length * 0.2)) : 0,
          fields,
          presence: lunr.Query.presence.REQUIRED,
        });
        continue;
      }

      query.term(term, { boost: 8, fields });
      query.term(term, {
        boost: 4,
        fields,
        wildcard: lunr.Query.wildcard.TRAILING,
      });
      query.term(term, {
        fields,
        presence: lunr.Query.presence.REQUIRED,
        wildcard: lunr.Query.wildcard.LEADING | lunr.Query.wildcard.TRAILING,
      });
    }
  });
}

async function createSearchAsync() {
  const [{ default: lunr }, response] = await Promise.all([
    import("lunr"),
    fetch("/search-index.json"),
  ]);
  if (!response.ok) {
    throw new Error(`Failed to load search index: ${response.status}`);
  }
  const serialized = (await response.json()) as {
    readonly index: object;
    readonly items: Readonly<Record<string, DataSearchItem>>;
  };
  const index = lunr.Index.load(serialized.index);
  const allItems = Object.values(serialized.items);

  return {
    search: (query: string, nameOnly: boolean): DataSearchResult[] => {
      if (!query) {
        return [];
      }
      if (/^=RAND\(\)/i.test(query.replaceAll(/\s/g, ""))) {
        return pickRandom(allItems, SEARCH_RANDOM_MAX_RESULTS).map((item) => ({
          item,
          matches: [],
          score: 0,
        }));
      }

      const directResults = runQuery(lunr, index, query, nameOnly, false);
      const results = directResults.length
        ? directResults
        : runQuery(lunr, index, query, nameOnly, true);
      return results.map((result) =>
        toSearchResult(result, serialized.items[result.ref])
      );
    },
  };
}

type SearchInstance = Awaited<ReturnType<typeof createSearchAsync>>;

let gSearchPromise: Promise<SearchInstance> | undefined;
function loadSearch(): Promise<SearchInstance> {
  gSearchPromise ??= createSearchAsync();
  return gSearchPromise;
}

export function useSearch(
  query: Readonly<Ref<string | null | undefined>>,
  nameOnly = false,
  eager = false
) {
  const search = shallowRef<SearchInstance | undefined>();
  if (eager && !import.meta.env.SSR) {
    // oxlint-disable-next-line @typescript-eslint/no-floating-promises
    loadSearch();
  }
  // oxlint-disable-next-line @typescript-eslint/no-floating-promises
  gSearchPromise?.then((instance): void => {
    search.value = instance;
  });

  return {
    loading: computed((): boolean => !search.value),
    results: computed(
      (): DataSearchResult[] =>
        (query.value?.trim() &&
          search.value?.search(query.value.trim(), nameOnly)) ||
        []
    ),
    load: async (): Promise<void> => {
      if (search.value) {
        return;
      }
      if (import.meta.env.SSR) {
        // oxlint-disable-next-line no-console
        console.info("Skip loading search index in SSR/SSG");
        return;
      }
      search.value = await loadSearch();
    },
  };
}
