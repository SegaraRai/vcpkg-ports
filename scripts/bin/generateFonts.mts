/*
SRC: fonts/docs/*.ttf
OUT: docs/fonts/*.woff2
*/

/* eslint-disable no-console */

import fsp from 'node:fs/promises';
import path from 'node:path';
import subsetFont from 'subset-font';
import { DIST_FONTS_DIR, SRC_FONTS_DIR } from '../constants.mjs';

// we had to generate subset fonts by ourselves to include font features (ligatures, slashed zeros, etc.)

// we only use 400 weights for code font
const FONT_FILES = ['JetBrainsMono-Regular.ttf', 'JetBrainsMono-Italic.ttf'];

const TEXT =
  ' !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~';

for (const fontFile of FONT_FILES) {
  const buffer = await fsp.readFile(path.join(SRC_FONTS_DIR));
  const subset = await subsetFont(buffer, TEXT, {
    targetFormat: 'woff2',
  });
  await fsp.writeFile(
    path.join(DIST_FONTS_DIR, fontFile.replace(/\.[^.]+$/, '.woff2')),
    subset
  );
  console.log(`Fonts: ${fontFile}`);
}

console.log('Fonts: Done');
