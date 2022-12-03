/*
SRC: data/vcpkg-ports.json
OUT: og/ports/index.json, og/ports/*.png
*/

/* eslint-disable no-console */

import { createHash } from 'node:crypto';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { asyncForeach } from '../../shared/asyncUtils.mjs';
import type {
  DataPortOGIndex,
  DataPortOGIndexItem,
} from '../../shared/dataTypes/ogIndex.mjs';
import { portNameToOGImageFilename } from '../../shared/pageConstants.mjs';
import { compareString } from '../../shared/utils.mjs';
import {
  CONCURRENCY,
  DATA_PORT_OG_INDEX_FILE,
  DIST_PORT_OG_IMAGE_DIR,
} from '../constants.mjs';
import { writeJSON } from '../jsonUtils.mjs';
import { createPortImageRenderer } from '../ogImageRenderer/ogRenderer.mjs';
import { VCPKG_HEAD_OID } from '../vcpkgInfo.mjs';

const renderer = createPortImageRenderer();

const entries: DataPortOGIndexItem[] = [];

await fsp.mkdir(DIST_PORT_OG_IMAGE_DIR, {
  recursive: true,
});

await asyncForeach(
  await renderer.portNamesPromise,
  async (portName): Promise<void> => {
    const png = await renderer.renderPNG(portName);
    const hash = createHash('sha256').update(png).digest('hex').slice(0, 8);
    const filename = portNameToOGImageFilename(portName, hash);
    entries.push([portName, filename]);
    await fsp.writeFile(path.join(DIST_PORT_OG_IMAGE_DIR, filename), png);
  },
  CONCURRENCY
);

entries.sort((a, b) => compareString(a[0], b[0]));

const data: DataPortOGIndex = {
  version: VCPKG_HEAD_OID,
  ogImageFilenames: entries,
};

await writeJSON(DATA_PORT_OG_INDEX_FILE, data);

console.log('Images: Done');
