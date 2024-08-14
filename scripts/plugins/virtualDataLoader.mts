import { env } from "node:process";
import type { Plugin } from "vite";
import type { DataHistory } from "../../shared/dataTypes/history.mjs";
import type { DataPortOGIndex } from "../../shared/dataTypes/ogIndex.mjs";
import type { DataPorts } from "../../shared/dataTypes/ports.mjs";
import type { DataVersion } from "../../shared/dataTypes/version.mjs";
import { portNameToFilename } from "../../shared/pageConstants.mjs";
import { portToSearchItem } from "../../shared/searchItemUtils.mjs";
import { serialize } from "../../shared/serialize.mjs";
import {
  DATA_HISTORY_FILE,
  DATA_PORTS_FILE,
  DATA_PORT_OG_INDEX_FILE,
  DATA_VERSION_FILE,
} from "../constants.mjs";
import { readJSON, tryReadJSON } from "../jsonUtils.mjs";
import { createPortContexts } from "../portContextUtils.mjs";

function getDataNameFromId(id: string): string | undefined {
  return id.match(/\/docs\/virtual\/([^.]+)/)?.[1];
}

function toModule(data: object, complex = false): string {
  return `export default (${
    complex ? serialize(data) : JSON.stringify(data)
  });`;
}

export default function virtualDataLoader(): Plugin {
  const MAX_PAGES = parseInt(env.VP_MAX_PAGES || "0", 10) || Infinity;
  if (isFinite(MAX_PAGES)) {
    console.warn(`VirtualDataLoader: MAX_PAGES=${MAX_PAGES}`);
  }

  const dataPromise = (async (): Promise<
    typeof import("../../docs/virtual/all.mjs")
  > => {
    const vcpkgPorts = (await readJSON(DATA_PORTS_FILE)) as DataPorts;
    const vcpkgVersion = (await readJSON(DATA_VERSION_FILE)) as DataVersion;
    const history = (await readJSON(DATA_HISTORY_FILE)) as DataHistory;
    let ogIndex = (await tryReadJSON(DATA_PORT_OG_INDEX_FILE)) as
      | DataPortOGIndex
      | undefined;
    if (!ogIndex) {
      console.warn("VirtualDataLoader: OG index not found");
      ogIndex = {
        version: vcpkgVersion.version,
        ogImageFilenames: [],
      };
    }
    const portContexts = await createPortContexts(vcpkgPorts, history, ogIndex);
    return {
      commitMap: new Map(history.commits.map((e) => [e.oid, e])),
      dataOGIndex: ogIndex,
      dataVcpkgHistory: history,
      dataVcpkgPorts: vcpkgPorts,
      dataVcpkgVersion: vcpkgVersion,
      headCommit: vcpkgVersion.head,
      portContexts,
      portManifests: vcpkgPorts.ports.map((port) => port.manifest),
      portMap: new Map(vcpkgPorts.ports.map((port) => [port.name, port])),
      portNames: vcpkgPorts.ports.map((port) => port.name),
      portPages: vcpkgPorts.ports
        .slice(0, MAX_PAGES)
        .map((port) => portNameToFilename(port.name)),
      searchItems: vcpkgPorts.ports.map(portToSearchItem),
    };
  })();

  const dataCodePromise = dataPromise.then((e) =>
    Object.fromEntries(
      Object.entries(e).map(([k, v]) => [
        k,
        toModule(v, k === "commitMap" || k === "portMap"),
      ])
    )
  );

  return {
    name: "vp-virtual-data-loader",
    enforce: "pre",
    async transform(_code, id) {
      const dataName = getDataNameFromId(id);
      if (!dataName) {
        return null;
      }
      const code =
        dataName === "all"
          ? await dataCodePromise
          : (await dataCodePromise)[dataName];
      if (!code) {
        throw new Error(`[vp-virtual-data-loader] Data ${dataName} not found`);
      }
      return code;
    },
  };
}
