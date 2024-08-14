import type { AstroConfig, AstroIntegration } from "astro";
import fsp from "node:fs/promises";
import path from "node:path";
import { env } from "node:process";
import { fileURLToPath } from "url";
import { asyncForeach } from "../../shared/asyncUtils.mjs";
import type { DataPortOGIndex } from "../../shared/dataTypes/ogIndex.mjs";
import { PORT_OG_IMAGE_PATH } from "../../shared/pageConstants.mjs";
import {
  CONCURRENCY,
  DATA_PORT_OG_INDEX_FILE,
  DIST_PORT_OG_IMAGE_DIR,
} from "../constants.mjs";
import { readJSON } from "../jsonUtils.mjs";

export default function copyOGImages(): AstroIntegration {
  let config: AstroConfig;

  return {
    name: "vp-copy-og-images",
    hooks: {
      "astro:config:done": (options) => {
        ({ config } = options);
      },
      "astro:build:done": async () => {
        const MAX_PAGES = parseInt(env.VP_MAX_PAGES || "0", 10) || Infinity;
        if (isFinite(MAX_PAGES)) {
          console.warn(`CopyOGImages: MAX_PAGES=${MAX_PAGES}`);
        }

        const outDir = fileURLToPath(config.outDir);
        const ogImageDestDir = path.join(
          outDir,
          PORT_OG_IMAGE_PATH.replace(/^\/+/, "")
        );

        const { ogImageFilenames } = (await readJSON(
          DATA_PORT_OG_INDEX_FILE
        )) as DataPortOGIndex;

        await fsp.mkdir(ogImageDestDir, {
          recursive: true,
        });

        const filenames = ogImageFilenames
          .slice(0, MAX_PAGES)
          .map(([, filename]) => filename);

        await asyncForeach(
          filenames,
          async (filename) => {
            await fsp.copyFile(
              path.join(DIST_PORT_OG_IMAGE_DIR, filename),
              path.join(ogImageDestDir, filename)
            );
          },
          CONCURRENCY
        );

        console.info(`Copied ${filenames.length} OG images`);
      },
    },
  };
}
