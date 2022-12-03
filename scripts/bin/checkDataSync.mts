/*
SRC: .vcpkg/*
OUT: (none)
*/

/* eslint-disable no-console */

import path from 'node:path';
import { exit } from 'node:process';
import {
  DATA_HISTORY_FILE,
  DATA_PORTS_FILE,
  DATA_PORT_OG_INDEX_FILE,
  DATA_VERSION_FILE,
  PROJECT_DIR,
} from '../constants.mjs';
import { tryReadJSON } from '../jsonUtils.mjs';
import { VCPKG_HEAD_OID } from '../vcpkgInfo.mjs';

const FILES = [
  [DATA_PORTS_FILE, true],
  [DATA_HISTORY_FILE, true],
  [DATA_VERSION_FILE, true],
  [DATA_PORT_OG_INDEX_FILE, false],
] as const;

let numErrors = 0;

for (const [filepath, mandatory] of FILES) {
  const filename = path.relative(PROJECT_DIR, filepath);
  const data = await tryReadJSON(filepath);
  if (!data) {
    if (mandatory) {
      console.error(`ERROR: ${filename} does not exist`);
      numErrors++;
    } else {
      console.warn(`WARN: ${filename} does not exist`);
    }
    continue;
  }
  if (data.version !== VCPKG_HEAD_OID) {
    console.error(`ERROR: ${filename} is outdated`);
    numErrors++;
    continue;
  }
  console.info(`Sync Check: ${filename} is up to date`);
}

console.log(`Sync Check: Done with ${numErrors} error(s)`);

if (numErrors) {
  exit(1);
}
