import type { AstroConfig, AstroIntegration } from "astro";
import Critters from "critters";
import fg from "fast-glob";
import { createHash } from "node:crypto";
import fsp from "node:fs/promises";
import path from "node:path";
import { env } from "node:process";
import { fileURLToPath } from "url";
import { asyncForeach } from "../../shared/asyncUtils.mjs";
import { replaceTemplates } from "../../shared/templateProcessor.mjs";
import { CONCURRENCY, CSP_HEADER_VALUE } from "../constants.mjs";

const HEADERS_FILENAME = "_headers";

function generateCSPHash(
  content: string,
  algorithm: "sha256" | "sha384" | "sha512" = "sha256"
): string {
  const hash = createHash(algorithm).update(content).digest("base64");
  return `'${algorithm}-${hash}'`;
}

function extractScripts(content: string, set: Set<string>): void {
  for (const [, code] of content.matchAll(/<script[^>]*>(.*?)<\/script>/gs)) {
    if (code) {
      set.add(code);
    }
  }
}

async function processHTML(
  filename: string,
  outDir: string,
  critters: Critters
): Promise<void> {
  const filepath = path.join(outDir, filename);

  let content = await fsp.readFile(filepath, "utf-8");

  // add theme classes to inline color schemes by theme
  content = content.replaceAll(
    "HTML_ROOT_CLASS_PLACEHOLDER",
    "HTML_ROOT_CLASS_P_BEGIN theme-dark theme-light HTML_ROOT_CLASS_P_END"
  );

  content = await critters.process(content);

  // remove theme classes
  content = content.replaceAll(
    /HTML_ROOT_CLASS_P_BEGIN theme-dark theme-light HTML_ROOT_CLASS_P_END\s*/g,
    ""
  );

  const scriptSet = new Set<string>();
  extractScripts(content, scriptSet);

  // Cloudflare Pages do not send too long header
  // so we have to embed long parts to the HTML files, rather than headers
  const metaCSPValue = [
    `script-src 'self' 'unsafe-inline' static.cloudflareinsights.com${[
      ...scriptSet,
    ]
      .map((t) => ` ${generateCSPHash(t)}`)
      .sort()
      .join("")}`,
  ].join("; ");
  const cspTag = `<meta content="${metaCSPValue}" http-equiv=Content-Security-Policy>`;

  await fsp.writeFile(
    filepath,
    content.replace("<!--#__CSP_PLACEHOLDER__#-->", cspTag)
  );
}

export default function postprocess(): AstroIntegration {
  let config: AstroConfig;

  return {
    name: "vp-postprocess",
    hooks: {
      "astro:config:done": (options) => {
        ({ config } = options);
      },
      "astro:build:done": async () => {
        const enableExpires = !!env.VP_ENABLE_EXPIRES_HEADER;

        const outDir = fileURLToPath(config.outDir);
        const headersFilepath = path.join(outDir, HEADERS_FILENAME);

        const htmlFilenames = await fg("**/*.{html,htm}", {
          cwd: outDir,
        });

        const nextMidnight = new Date();
        nextMidnight.setUTCHours(24, 0, 0, 0);

        const expires = nextMidnight.toUTCString();

        const replacements: Readonly<Record<string, string>> = {
          CSP_HEADER: `Content-Security-Policy: ${CSP_HEADER_VALUE}`,
          EXPIRES_HEADER: `${enableExpires ? "" : "# "}Expires: ${expires}`,
        };

        await fsp.writeFile(
          headersFilepath,
          replaceTemplates(
            await fsp.readFile(headersFilepath, "utf-8"),
            replacements
          )
        );

        console.info(
          `Headers file ${HEADERS_FILENAME} processed with`,
          replacements
        );

        const critters = new Critters({
          path: outDir,
          logLevel: "warn",
          external: true,
          preloadFonts: true,
          inlineFonts: false,
          minimumExternalSize: 2048,
        });

        const cache = new Map<string, Promise<string>>();
        critters.readFile = (filename): Promise<string> => {
          let promise = cache.get(filename);
          if (!promise) {
            promise = fsp.readFile(filename, "utf-8").then((code): string =>
              // avoid inlining too large icons
              code.replace(
                /(?<=[\s;{])(?:background|--un-icon)\s*:\s*url\s*\(\s*["']data:[\s\S]+?["']\)[^};]*(?:;|(?=}))/g,
                (match): string => (match.length <= 256 ? match : "")
              )
            );
            cache.set(filename, promise);
          }
          return promise;
        };

        // process HTML files
        await asyncForeach(
          htmlFilenames,
          (filename) => processHTML(filename, outDir, critters),
          CONCURRENCY
        );

        console.info(`Processed ${htmlFilenames.length} HTML files`);
      },
    },
  };
}
