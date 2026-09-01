import { defineConfig } from "taze";

export default defineConfig({
  exclude: ["typescript@7"],
  force: true,
  packageMode: {
    "@types/node": "minor",
    vite: "minor",
  },
});
