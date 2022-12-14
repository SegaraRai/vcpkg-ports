// @ts-check

import { defineConfig } from 'taze';

export default defineConfig({
  force: true,
  packageMode: {
    '@types/node': 'minor',
    vite: 'minor',
  },
});
