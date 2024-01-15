/*
SRC: .vcpkg/*
OUT: (none)
*/

/* eslint-disable no-console */

import fsp from 'node:fs/promises';
import path from 'node:path';
import { exit } from 'node:process';
import { ZodError } from 'zod';
import { getDependencies } from '../../shared/vcpkg/portUtils.mjs';
import {
  type Vcpkg,
  type VcpkgFeatureItem,
  parseVcpkgJSON,
} from '../../shared/vcpkg/schema.mjs';
import { VCPKG_DIR } from '../constants.mjs';
import { VCPKG_PORT_NAMES } from '../vcpkgInfo.mjs';

let numErrors = 0;
let numWarnings = 0;

const VCPKG_PORT_MANIFEST_MAP = new Map<string, Vcpkg>();

// check port manifests
for (const portName of VCPKG_PORT_NAMES) {
  try {
    const jsonFilepath = path.join(VCPKG_DIR, 'ports', portName, 'vcpkg.json');
    const manifest = parseVcpkgJSON(await fsp.readFile(jsonFilepath, 'utf8'));
    // check name
    if (manifest.name !== portName) {
      throw new Error(`name is not ${portName}`);
    }
    // check if default features are valid
    const featureNameSet = new Set<string>(
      Object.keys(manifest.features ?? {})
    );
    for (const feature of manifest['default-features'] ?? []) {
      const featureName = typeof feature === 'string' ? feature : feature.name;
      if (!featureNameSet.has(featureName)) {
        throw new Error(`default feature ${featureName} does not exist`);
      }
    }
    // add to map
    VCPKG_PORT_MANIFEST_MAP.set(portName, manifest);
  } catch (error) {
    console.error(
      `ERROR: failed to validate .vcpkg/ports/${portName}/vcpkg.json`
    );
    if (error instanceof ZodError) {
      console.error(error.message);
    } else {
      console.error(error);
    }
    numErrors++;
  }
}

// check dependencies
// some ports have dependencies that are not in the vcpkg repo
// e.g. https://github.com/microsoft/vcpkg/blob/2022.11.14/ports/qtvirtualkeyboard/vcpkg.json#L38-L43
if (numErrors === 0) {
  const checkDependency = (
    dependent: string,
    dependency: string,
    features: readonly VcpkgFeatureItem[] = []
  ): void => {
    // check port existence
    const manifest = VCPKG_PORT_MANIFEST_MAP.get(dependency);
    if (!manifest) {
      console.warn(
        `WARN: dependency ${dependency} does not exist (dependent: ${dependent})`
      );
      numWarnings++;
      return;
    }

    // check feature existence
    for (const feature of features) {
      const featureName = typeof feature === 'string' ? feature : feature.name;
      if (!manifest.features?.[featureName]) {
        console.warn(
          `WARN: feature ${featureName} does not exist in ${dependency} (dependent: ${dependent})`
        );
        numWarnings++;
      }
    }
  };

  for (const manifest of VCPKG_PORT_MANIFEST_MAP.values()) {
    // check dependencies
    for (const dep of getDependencies(manifest)) {
      checkDependency(manifest.name, dep.name, dep.features);
    }
    // check feature dependencies
    for (const [featureName, feature] of Object.entries(
      manifest.features ?? {}
    )) {
      for (const dep of getDependencies(feature)) {
        checkDependency(
          `${manifest.name}#${featureName}`,
          dep.name,
          dep.features
        );
      }
    }
  }
}

console.log(
  `Port Validation: Validated ${VCPKG_PORT_NAMES.length} ports. ${numErrors} error(s) and ${numWarnings} warning(s) found`
);

if (numErrors) {
  exit(1);
}
