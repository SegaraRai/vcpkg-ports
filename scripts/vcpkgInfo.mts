import { execFile } from 'node:child_process';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { VCPKG_DIR } from './constants.mjs';
import { GIT_BIN } from './gitBin.mjs';

const execFileAsync = promisify(execFile);

export const VCPKG_PORT_NAMES: readonly string[] = (
  await fsp.readdir(path.join(VCPKG_DIR, 'ports'), {
    withFileTypes: true,
  })
)
  .filter((e) => e.isDirectory())
  .map((e) => e.name)
  .sort();

export const VCPKG_HEAD_OID = (
  await execFileAsync(GIT_BIN, ['rev-parse', 'HEAD'], {
    cwd: VCPKG_DIR,
  })
).stdout.trim();
