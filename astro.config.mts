import sitemap from "@astrojs/sitemap";
import vue from "@astrojs/vue";
import compress from "astro-compress";
import { defineConfig } from "astro/config";
import unoCSS from "unocss/astro";
import icons from "unplugin-icons/vite";
import { CSP_HEADER_VALUE, DATA_HISTORY_FILE } from "./scripts/constants.mjs";
import { readJSON } from "./scripts/jsonUtils.mjs";
import copyOGImages from "./scripts/plugins/copyOGImages.mjs";
import postprocess from "./scripts/plugins/postprocess.mjs";
import virtualDataLoader from "./scripts/plugins/virtualDataLoader.mjs";
import type { DataHistory } from "./shared/dataTypes/history.mjs";
import { filenameToPortName } from "./shared/pageConstants.mjs";

async function createDataForSitemap() {
  const history = (await readJSON(DATA_HISTORY_FILE)) as DataHistory;
  const commitMap = new Map(history.commits.map((e) => [e.oid, e]));
  const portCommitsMap = new Map(
    history.ports.map((port) => [port.name, port.commits])
  );
  return {
    commitMap,
    portCommitsMap,
  };
}

const sitemapDataPromise = createDataForSitemap();

export default defineConfig({
  build: {
    assets: "assets",
    format: "file",
  },
  server: {
    headers: {
      "Content-Security-Policy": CSP_HEADER_VALUE,
    },
  },
  srcDir: "docs",
  site: `https://vcpkg.roundtrip.dev/`,
  trailingSlash: "never", // per CF Pages spec (https://developers.cloudflare.com/pages/platform/serving-pages/#route-matching)
  integrations: [
    unoCSS({
      injectReset: true,
    }),
    vue(),
    sitemap({
      changefreq: "daily",
      priority: 1,
      serialize: async (item) => {
        const { commitMap, portCommitsMap } = await sitemapDataPromise;
        const match = item.url.match(/\/ports\/([^/]+)$/);
        if (match) {
          const portName = filenameToPortName(match[1]);
          const commits = portCommitsMap.get(portName);
          if (!commits) {
            throw new Error(`No commits found for ${portName}`);
          }
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          const commitHash = commits.at(-1)!;
          const commit = commitMap.get(commitHash);
          if (!commit) {
            throw new Error(`No commit found for ${commitHash}`);
          }
          item.lastmod = commit.committer[0];
          item.priority = 0.5;
        }
        return item;
      },
    }),
    compress({
      HTML: {
        "html-minifier-terser": {
          collapseWhitespace: true,
          conservativeCollapse: false,
          decodeEntities: true,
          removeComments: true,
          removeRedundantAttributes: true,
          sortAttributes: true,
          sortClassName: true,
          useShortDoctype: true,
          minifyCSS: true,
          minifyJS: true,
          ignoreCustomComments: [
            // Possible important comments (licenses, CSP placeholder, etc.)
            /^\s*[!#]/,
            // Vue comments (even empty comments must be preserved)
            /^[[\]]*$/,
          ],
        },
      },
      SVG: {
        svgo: {
          multipass: true,
        },
      },
    }),
    postprocess(),
    copyOGImages(),
  ],
  vite: {
    build: {
      minify: "esbuild",
      rollupOptions: {
        output: {
          assetFileNames: "assets/[hash][extname]",
          chunkFileNames: "assets/[hash].js",
          entryFileNames: "assets/[hash].js",
        },
      },
    },
    plugins: [
      icons({
        // we import icons from vue components, not from astro components
        compiler: "vue3",
      }),
      virtualDataLoader(),
    ],
  },
});
