import type { DataPortsPort } from "../dataTypes/ports.mjs";
import { compareString, toUniqueArray } from "../utils.mjs";
import {
  getDependencies,
  getFeatureName,
  isHostDependency,
  isNormalDependency,
  transformPortDependencyToObject,
} from "./portUtils.mjs";
import type { Vcpkg, VcpkgDependencyObject } from "./schema.mjs";

export const DEPENDENCY_PATH_DELIMITER = "/";

export type VcpkgDependencyObjectEx = VcpkgDependencyObject & {
  readonly $ex: true;
  readonly $dependents: readonly string[];
  readonly $features: readonly string[];
};

export function collectTransitiveDependencies(
  portName: string,
  portMap: ReadonlyMap<string, DataPortsPort>,
  onlyFeatures = false,
  features: readonly string[] = [],
  filter: (dependency: VcpkgDependencyObject) => boolean = () => true
): ReadonlyMap<string, VcpkgDependencyObjectEx> {
  const map = new Map<string, VcpkgDependencyObjectEx>();
  const add = (
    dep: VcpkgDependencyObject,
    feats: readonly string[],
    path: string
  ): void => {
    const depPort = portMap.get(dep.name);
    if (!depPort) {
      throw new Error(`Port not found: ${dep.name}`);
    }

    const depManifest = depPort.manifest;
    const depInfoInMap = map.get(depManifest.name);

    const featsInMap = depInfoInMap?.$features;
    const featsSpecified = feats;
    if (featsInMap?.join("\0") === featsSpecified.join("\0")) {
      // dependency already checked with the same features
      return;
    }

    const newPath = `${path}${DEPENDENCY_PATH_DELIMITER}${dep.name}`;
    const mergedFeats = toUniqueArray([
      ...(depInfoInMap?.$features ?? []),
      ...feats,
    ]);

    /*
    if (featsInMap) {
      console.info(
        `INFO: Dependency ${
          dep.name
        } has required with different features: '${featsInMap.join()}' vs '${featsSpecified.join()}' (default: '${
          depManifest['default-features']?.join() ?? ''
        }', dependent: ${newPath})`
      );
    }
    //*/

    map.set(dep.name, {
      ...dep,
      $ex: true,
      $dependents: [
        ...(depInfoInMap?.$dependents ?? []),
        path.slice(DEPENDENCY_PATH_DELIMITER.length),
      ],
      $features: mergedFeats,
    });

    const deps: VcpkgDependencyObject[] = [];
    if (!depInfoInMap) {
      // common dependencies are not checked yet
      deps.push(...getDependencies(depManifest));
    }
    for (const feat of feats) {
      if (depInfoInMap?.$features.includes(feat)) {
        // feature dependencies already checked
        continue;
      }
      const featInfo = depManifest.features?.[feat];
      if (!featInfo) {
        // eslint-disable-next-line no-console
        console.warn(
          `WARN: Feature ${feat} not found in ${dep.name} (dependent: ${newPath})`
        );
        continue;
      }
      const featDeps = featInfo.dependencies ?? [];
      deps.push(...featDeps.map(transformPortDependencyToObject));
    }

    // add dependencies recursively
    for (const subDep of deps.filter(filter)) {
      const subDepManifest = portMap.get(subDep.name)?.manifest;
      if (!subDepManifest) {
        // eslint-disable-next-line no-console
        console.warn(
          `WARN: Port ${subDep.name} not found (dependent: ${newPath})`
        );
        continue;
      }
      const includeDefaultFeatures = subDep["default-features"] !== false;
      const subFeats = toUniqueArray([
        ...((includeDefaultFeatures && subDepManifest["default-features"]) ||
          []),
        ...(subDep.features ?? []),
      ])
        .map(getFeatureName)
        .sort();
      add(subDep, subFeats, newPath);
    }
  };
  if (onlyFeatures) {
    map.set(portName, {
      name: portName,
      $ex: true,
      $dependents: [],
      $features: [],
    });
  }
  add({ name: portName }, features, "");
  map.delete(portName);
  return map;
}

export function analyzeDependencies(
  manifest: Vcpkg,
  portMap: ReadonlyMap<string, DataPortsPort>,
  features: readonly string[] = [],
  onlyFeatures = false
) {
  const allDepMap = collectTransitiveDependencies(
    manifest.name,
    portMap,
    onlyFeatures,
    features
  );
  const allNormalDepMap = collectTransitiveDependencies(
    manifest.name,
    portMap,
    onlyFeatures,
    features,
    isNormalDependency
  );
  const directDeps: readonly VcpkgDependencyObject[] = onlyFeatures
    ? features.flatMap((featureName) =>
        getDependencies(manifest.features?.[featureName] ?? {})
      )
    : getDependencies(manifest);
  const directNormalDeps: readonly VcpkgDependencyObject[] =
    directDeps.filter(isNormalDependency);
  const directHostDeps: readonly VcpkgDependencyObject[] =
    directDeps.filter(isHostDependency);
  const transitiveNormalDeps: readonly VcpkgDependencyObjectEx[] = Array.from(
    allNormalDepMap.values()
  )
    .filter((dep) => directNormalDeps.every((d) => d.name !== dep.name))
    .sort((a, b) => compareString(a.name, b.name));
  const transitiveHostDeps: readonly VcpkgDependencyObjectEx[] = Array.from(
    allDepMap.values()
  )
    .filter(
      (dep) =>
        !allNormalDepMap.has(dep.name) &&
        directHostDeps.every((d) => d.name !== dep.name)
    )
    .sort((a, b) => compareString(a.name, b.name));

  return {
    allDepMap,
    allNormalDepMap,
    directNormalDeps,
    directHostDeps,
    transitiveNormalDeps,
    transitiveHostDeps,
  };
}
