export type DataPortOGIndexItem = readonly [portName: string, fileName: string];

export interface DataPortOGIndex {
  readonly version: string;
  readonly ogImageFilenames: readonly DataPortOGIndexItem[];
}
