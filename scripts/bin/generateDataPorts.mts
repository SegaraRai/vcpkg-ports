/*
SRC: .vcpkg/*
OUT: data/vcpkg-ports.json
*/

/* eslint-disable no-console */

import fsp from 'node:fs/promises';
import path from 'node:path';
import fg from 'fast-glob';
import { asyncMap } from '../../shared/asyncUtils.mjs';
import type {
  DataPorts,
  DataPortsPort,
} from '../../shared/dataTypes/ports.mjs';
import { parseVcpkgJSON } from '../../shared/vcpkg/schema.mjs';
import { CONCURRENCY, DATA_PORTS_FILE, VCPKG_DIR } from '../constants.mjs';
import { writeJSON } from '../jsonUtils.mjs';
import { VCPKG_HEAD_OID, VCPKG_PORT_NAMES } from '../vcpkgInfo.mjs';

const ports: readonly DataPortsPort[] = await asyncMap(
  VCPKG_PORT_NAMES,
  async (portName) => {
    const dir = path.join(VCPKG_DIR, 'ports', portName);
    const manifestFilepath = path.join(dir, 'vcpkg.json');
    const manifest = parseVcpkgJSON(
      await fsp.readFile(manifestFilepath, 'utf8')
    );
    if (manifest.name !== portName) {
      throw new Error(
        `vcpkg.json name mismatch: ${manifest.name} !== ${portName}`
      );
    }
    return {
      name: portName,
      manifest,
      files: (
        await fg('**/*', {
          cwd: dir,
        })
      ).sort(),
    };
  },
  CONCURRENCY
);

const data: DataPorts = {
  version: VCPKG_HEAD_OID,
  ports,
};

await writeJSON(DATA_PORTS_FILE, data);

console.log('Ports: Done');
