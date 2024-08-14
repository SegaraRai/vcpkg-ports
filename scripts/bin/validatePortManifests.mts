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

let numChecked = 0;
let numErrors = 0;
let numWarnings = 0;

const filterPortNames = process.argv.slice(2);

const VCPKG_PORT_MANIFEST_MAP = new Map<string, Vcpkg>();

// check port manifests
for (const portName of VCPKG_PORT_NAMES) {
  if (
    filterPortNames.length > 0 &&
    !filterPortNames.every((name) => portName.includes(name))
  ) {
    continue;
  }

  numChecked++;

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
if (numChecked !== VCPKG_PORT_NAMES.length) {
  console.warn(
    "WARN: Dependency validation is skipped because not all ports' manifests are parsed"
  );
} else if (numErrors !== 0) {
  console.warn(
    'WARN: Dependency validation is skipped because of errors in port manifests'
  );
} else {
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

  for (const [portName, manifest] of VCPKG_PORT_MANIFEST_MAP) {
    if (
      filterPortNames.length > 0 &&
      !filterPortNames.every((name) => portName.includes(name))
    ) {
      continue;
    }

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

if (!numChecked) {
  console.error('Portfile: No ports found');
  exit(1);
}

console.log(
  `Port Validation: Validated ${numChecked} of ${VCPKG_PORT_NAMES.length} ports. ${numErrors} error(s) and ${numWarnings} warning(s) found`
);

if (numErrors) {
  exit(1);
}
