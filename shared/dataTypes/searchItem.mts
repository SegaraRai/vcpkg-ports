export interface DataSearchItem {
  readonly name: string;
  readonly version: string;
  readonly description: string;
}

export interface DataSearchMatch {
  readonly key: keyof DataSearchItem;
  readonly indices: readonly (readonly [begin: number, end: number])[];
}

export interface DataSearchResult {
  readonly item: DataSearchItem;
  readonly matches: readonly DataSearchMatch[];
  readonly score: number;
}
