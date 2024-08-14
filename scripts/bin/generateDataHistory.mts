/*
SRC: .vcpkg/*
OUT: data/vcpkg-history.json, data/vcpkg-version.json
*/

import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { argv, exit } from "node:process";
import { promisify } from "node:util";
import type {
  DataHistory,
  DataHistoryCommit,
} from "../../shared/dataTypes/history.mjs";
import type { DataVersion } from "../../shared/dataTypes/version.mjs";
import {
  DATA_HISTORY_FILE,
  DATA_VERSION_FILE,
  VCPKG_DIR,
} from "../constants.mjs";
import { GIT_BIN } from "../gitBin.mjs";
import { tryReadJSON, writeJSON } from "../jsonUtils.mjs";
import { VCPKG_HEAD_OID, VCPKG_PORT_NAMES } from "../vcpkgInfo.mjs";

const execFileAsync = promisify(execFile);

function hashEmail(email: string): string {
  return createHash("md5")
    .update(email.normalize().trim().toLowerCase())
    .digest("hex");
}

function getGitHubUserFromEmail(email: string): string | null {
  return email.match(/^([^@]+)@users\.noreply\.github\.com$/i)?.[1] ?? null;
}

async function gitLog<T extends Readonly<Record<string, string>>>(
  spec: Readonly<T>,
  range: string
): Promise<
  ({ readonly [K in keyof T]: string } & {
    readonly files: readonly string[];
  })[]
> {
  const DELIMITER_SPEC = "%n%n%n%n";
  const DELIMITER = DELIMITER_SPEC.replaceAll("%n", "\n");

  const formatSpec = Object.entries(spec)
    .map(([key, value]) => `////${key}=${value}`)
    .join("%n");
  const args = [
    "log",
    "--name-only",
    `--format=${DELIMITER_SPEC}${formatSpec}`,
    range,
  ].filter((v) => v);
  const { stdout } = await execFileAsync(GIT_BIN, args, {
    cwd: VCPKG_DIR,
    maxBuffer: 1 * 1024 * 1024 * 1024,
  });

  const results: ({ readonly [K in keyof T]: string } & {
    readonly files: readonly string[];
  })[] = [];
  for (const chunk of stdout.split(DELIMITER)) {
    const trimmed = chunk.trim();
    if (!trimmed) {
      continue;
    }

    const files: string[] = [];
    const result: Record<string, string | string[]> = {
      files,
    };
    for (const line of trimmed.split("\n")) {
      const lineTrimmed = line.trim();
      if (!lineTrimmed) {
        continue;
      }

      const match = lineTrimmed.match(/^\/\/\/\/([^=]+)=(.*)$/);
      if (match) {
        result[match[1]] = match[2];
      } else {
        files.push(lineTrimmed);
      }
    }

    results.push(result as (typeof results)[number]);
  }

  return results;
}

/**
 * if `base` is specified, history will be built incrementally
 * @param base old history.json data
 * @returns new history.json data
 */
async function generateHistory(
  base: DataHistory | null | undefined
): Promise<DataHistory> {
  const fromCommitId = base?.head.oid;
  if (fromCommitId) {
    console.log(`History: Build history incrementally from ${fromCommitId}`);
  } else {
    console.log("History: Build history from scratch");
  }

  const transformCommit = (
    commit: (typeof allCommits)[0]
  ): DataHistoryCommit => {
    return {
      oid: commit.oid,
      message: commit.message,
      author: [
        commit.author_date,
        commit.author_name,
        hashEmail(commit.author_email),
        getGitHubUserFromEmail(commit.author_email),
      ] as const,
      committer: [
        commit.committer_date,
        commit.committer_name,
        hashEmail(commit.committer_email),
        getGitHubUserFromEmail(commit.committer_email),
      ] as const,
    };
  };

  /**
   * descending-order (the latest commit first)
   * - the first element is HEAD
   * - the last element is the `from` commit (if specified), or first (initial) commit (if not specified)
   */
  const allCommits = await gitLog(
    {
      oid: "%H",
      parent: "%P",
      message: "%s",
      author_email: "%ae",
      author_name: "%an",
      author_date: "%aI",
      committer_email: "%ce",
      committer_name: "%cn",
      committer_date: "%cI",
    },
    fromCommitId ? `${fromCommitId}^...HEAD` : "HEAD"
  );

  console.log(`History: Read ${allCommits.length} commit(s)`);

  if (allCommits.length === 0) {
    throw new Error("No commits found");
  }

  if (allCommits[0].oid !== VCPKG_HEAD_OID) {
    throw new Error("HEAD oid mismatch");
  }

  if (fromCommitId) {
    if (allCommits.at(-1)?.oid !== fromCommitId) {
      throw new Error("Base oid mismatch");
    }

    if (allCommits.length === 1) {
      console.log("History: Nothing changed since last build");
      return base;
    }

    allCommits.pop();
  }

  const involvedCommitIdSet = new Set<string>();
  const portCommitsMap = new Map<string, string[]>(
    VCPKG_PORT_NAMES.map((name) => [name, []])
  );
  for (const { oid, files } of allCommits.slice().reverse()) {
    const affectedPorts = Array.from(
      new Set(
        files
          .map((file) => file.match(/^ports\/([^/]+)/)?.[1])
          .filter((v): v is string => !!v)
      )
    ).sort();

    for (const portName of affectedPorts) {
      const commits = portCommitsMap.get(portName);
      if (!commits) {
        // possibly deleted port (not an error)
        console.info(
          `Port ${portName} is not in current port list (commit ${oid})`
        );
        continue;
      }
      commits.push(oid);
      involvedCommitIdSet.add(oid);
    }
  }

  const basePortCommitsMap: ReadonlyMap<string, readonly string[]> | null = base
    ? new Map(base.ports.map(({ name, commits }) => [name, commits]))
    : null;
  const mergedPortCommitsMap: ReadonlyMap<string, readonly string[]> =
    basePortCommitsMap
      ? new Map(
          Array.from(portCommitsMap.entries()).map(([name, commits]) => [
            name,
            [...(basePortCommitsMap.get(name) || []), ...commits],
          ])
        )
      : portCommitsMap;

  return {
    version: VCPKG_HEAD_OID,
    head: transformCommit(allCommits[0]),
    ports: Array.from(mergedPortCommitsMap.entries()).map(
      ([name, commits]) => ({
        name,
        commits,
      })
    ),
    commits: allCommits
      .filter((commit) => !commit.parent || involvedCommitIdSet.has(commit.oid))
      .map((commit) => transformCommit(commit))
      .concat(base?.commits ?? []),
  };
}

function validateDataHistory(data: DataHistory): void {
  let numErrors = 0;

  const portNameSet = new Set(data.ports.map((e) => e.name));
  const commitIdSet = new Set(data.commits.map((e) => e.oid));

  for (const portName of VCPKG_PORT_NAMES) {
    if (!portNameSet.has(portName)) {
      console.error(`History: Missing port ${portName}`);
      numErrors++;
    }
  }

  for (const port of data.ports) {
    for (const commitId of port.commits) {
      if (!commitIdSet.has(commitId)) {
        console.error(
          `History: Missing commit ${commitId} for port ${port.name}`
        );
        numErrors++;
      }
    }
  }

  if (numErrors > 0) {
    throw new Error(`Validation failed: ${numErrors} errors`);
  }

  console.log("History: Validation passed");
}

// write vcpkg-history.json

const oldData = !argv.includes("--no-incremental")
  ? ((await tryReadJSON(DATA_HISTORY_FILE)) as DataHistory | undefined)
  : undefined;
const newData = await generateHistory(oldData);

try {
  validateDataHistory(newData);
} catch (e) {
  console.error(`History: ${String(e)}`);
  console.error("History: Try building with --no-incremental");
  exit(1);
}

await writeJSON(DATA_HISTORY_FILE, newData);

// write vcpkg-version.json

const versionData: DataVersion = {
  version: newData.version,
  head: newData.head,
  ports: newData.ports.map(({ name }) => name),
};
await writeJSON(DATA_VERSION_FILE, versionData);

console.log("History: Done");
