import type { DataHistoryCommit } from "./history.mjs";

export interface DataVersion {
  readonly version: string;
  readonly head: DataHistoryCommit;
  readonly ports: readonly string[];
}
