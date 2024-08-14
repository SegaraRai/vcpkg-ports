import type { DataPortsPort } from "../dataTypes/ports.mjs";
import { toUniqueArray } from "../utils.mjs";
import { getDependencies, isNormalDependency } from "./portUtils.mjs";
import type { VcpkgDependencyObject } from "./schema.mjs";

export const DEPENDENT_FEATURE_DELIMITER = "#";

export function createDependentsMap(
  portMap: ReadonlyMap<string, DataPortsPort>
): ReadonlyMap<
  string,
  readonly [normal: readonly string[], host: readonly string[]]
> {
  const dependentsMap = new Map<string, [normal: string[], host: string[]]>(
    [...portMap.keys()].map((portName) => [portName, [[], []]])
  );

  const getIndex = (dependency: VcpkgDependencyObject): number =>
    isNormalDependency(dependency) ? 0 : 1;

  for (const { manifest } of portMap.values()) {
    for (const dependency of getDependencies(manifest)) {
      dependentsMap
        .get(dependency.name)
        ?.[getIndex(dependency)].push(manifest.name);
    }
    for (const [featureName, feature] of Object.entries(
      manifest.features ?? {}
    )) {
      const name = `${manifest.name}${DEPENDENT_FEATURE_DELIMITER}${featureName}`;
      for (const dependency of getDependencies(feature)) {
        dependentsMap.get(dependency.name)?.[getIndex(dependency)].push(name);
      }
    }
  }

  return new Map(
    Array.from(dependentsMap.entries()).map(([k, v]) => [
      k,
      [toUniqueArray(v[0]).sort(), toUniqueArray(v[1]).sort()],
    ])
  );
}
