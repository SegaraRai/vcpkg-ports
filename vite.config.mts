import { defineConfig } from 'vite';
import { CSP_HEADER_VALUE } from './scripts/constants.mjs';

export default defineConfig({
  server: {
    headers: {
      'Content-Security-Policy': CSP_HEADER_VALUE,
    },
  },
});
