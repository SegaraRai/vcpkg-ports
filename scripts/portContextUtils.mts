import fsp from "node:fs/promises";
import path from "node:path";
import { asyncMap } from "../shared/asyncUtils.mjs";
import type { DataHistory } from "../shared/dataTypes/history.mjs";
import type { DataPortOGIndex } from "../shared/dataTypes/ogIndex.mjs";
import type { PortContext } from "../shared/dataTypes/portContext.mjs";
import type { DataPorts, DataPortsPort } from "../shared/dataTypes/ports.mjs";
import { inferCopyrightsFromPortfile } from "../shared/inferCopyrightsFromPortfile.mjs";
import { isFileIncludedInPortContext } from "../shared/utils.mjs";
import { createDependentsMap } from "../shared/vcpkg/portDependents.mjs";
import {
  getPortVersionText,
  getShortPortDescription,
  stringifyPortDescription,
} from "../shared/vcpkg/portUtils.mjs";
import { CONCURRENCY, VCPKG_DIR } from "./constants.mjs";

export function createPortContexts(
  { ports }: DataPorts,
  { commits: allCommits, ports: portCommits }: DataHistory,
  ogIndex: DataPortOGIndex
): Promise<PortContext[]> {
  const portMap = new Map(ports.map((e) => [e.name, e]));
  const portCommitsMap = new Map(
    portCommits.map((item) => [item.name, item.commits])
  );
  const commitMap = new Map(allCommits.map((item) => [item.oid, item]));
  const ogImageFilenameMap = new Map(ogIndex.ogImageFilenames);
  const dependentsMap = createDependentsMap(portMap);

  const toPortContext = async ({
    manifest,
    files,
  }: DataPortsPort): Promise<PortContext> => {
    const { name } = manifest;
    const commits = portCommitsMap.get(name);
    if (!commits) {
      throw new Error(
        `No commits found for port ${name}. run 'pnpm generate:data'.`
      );
    }
    const dependents = dependentsMap.get(name);
    if (!dependents) {
      throw new Error(`No dependents found for port ${name}.`);
    }
    const firstCommit = commitMap.get(commits[0]);
    if (!firstCommit) {
      throw new Error(`Commit ${commits[0]} not found.`);
    }
    const lastCommit = commitMap.get(commits[commits.length - 1]);
    if (!lastCommit) {
      throw new Error(`Commit ${commits[commits.length - 1]} not found.`);
    }
    const version = getPortVersionText(manifest);
    const portfile = await fsp.readFile(
      path.join(VCPKG_DIR, "ports", name, "portfile.cmake"),
      "utf-8"
    );
    const inferredCopyrightURLs = inferCopyrightsFromPortfile(
      name,
      version,
      portfile
    );
    return {
      name,
      version,
      description: stringifyPortDescription(manifest.description),
      shortDescription: getShortPortDescription(manifest.description),
      createdAt: firstCommit.committer[0],
      modifiedAt: lastCommit.committer[0],
      ogImageFilename: ogImageFilenameMap.get(name),
      manifest,
      commits,
      normalDependents: dependents[0],
      hostDependents: dependents[1],
      files,
      fileContents: await Promise.all(
        files
          .filter(isFileIncludedInPortContext)
          .map(async (filename) => [
            filename,
            await fsp.readFile(
              path.join(VCPKG_DIR, "ports", name, filename),
              "utf-8"
            ),
          ])
      ),
      inferredCopyrightURLs,
    };
  };

  return asyncMap(ports, toPortContext, CONCURRENCY);
}
