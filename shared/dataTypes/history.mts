export type DataHistoryCommitAuthor = readonly [
  timestamp: string,
  name: string,
  emailHash: string,
  /** local part of `<someone>@users.noreply.github.com` */
  githubUser: string | null,
];

export interface DataHistoryCommit {
  readonly oid: string;
  readonly message: string;
  readonly author: DataHistoryCommitAuthor;
  readonly committer: DataHistoryCommitAuthor;
}

export interface DataHistoryPort {
  readonly name: string;
  /** ascending-order (the oldest commit is first) */
  readonly commits: readonly string[];
}

export interface DataHistory {
  readonly version: string;
  readonly head: DataHistoryCommit;
  readonly ports: readonly DataHistoryPort[];
  readonly commits: readonly DataHistoryCommit[];
}
