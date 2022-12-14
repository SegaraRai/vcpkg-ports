/*
SRC: .vcpkg/*
OUT: (none)
*/

/* eslint-disable no-console */

import fsp from 'node:fs/promises';
import path from 'node:path';
import { exit } from 'node:process';
import { parseCMake } from '../../shared/cmakeParser.mjs';
import { VCPKG_DIR } from '../constants.mjs';
import { VCPKG_PORT_NAMES } from '../vcpkgInfo.mjs';

let numErrors = 0;
const numWarnings = 0;

for (const portName of VCPKG_PORT_NAMES) {
  try {
    const portfileFilepath = path.join(
      VCPKG_DIR,
      'ports',
      portName,
      'portfile.cmake'
    );
    const portfile = await fsp.readFile(portfileFilepath, 'utf8');
    const parsed = parseCMake(portfile);
    if (!parsed) {
      throw new Error('failed to parse');
    }
  } catch (error) {
    console.error(`ERROR: failed to parse ${portName}/portfile.cmake`);
    console.error(error);
    numErrors++;
  }
}

console.log(
  `Portfile: Parsed ${VCPKG_PORT_NAMES.length} ports. ${numErrors} error(s) and ${numWarnings} warning(s) found`
);

if (numErrors) {
  exit(1);
}
