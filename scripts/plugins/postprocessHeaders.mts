import { createHash } from 'node:crypto';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { env } from 'node:process';
import { fileURLToPath } from 'url';
import type { AstroConfig, AstroIntegration } from 'astro';
import fg from 'fast-glob';
import { asyncForeach } from '../../shared/asyncUtils.mjs';
import { replaceTemplates } from '../../shared/templateProcessor.mjs';
import { CONCURRENCY, CSP_HEADER_VALUE } from '../constants.mjs';

const HEADERS_FILENAME = '_headers';

function generateCSPHash(
  content: string,
  algorithm: 'sha256' | 'sha384' | 'sha512' = 'sha256'
): string {
  const hash = createHash(algorithm).update(content).digest('base64');
  return `'${algorithm}-${hash}'`;
}

function extractScripts(content: string, set: Set<string>): void {
  for (const [, code] of content.matchAll(/<script[^>]*>(.*?)<\/script>/gs)) {
    if (code) {
      set.add(code);
    }
  }
}

function extractStyles(content: string, set: Set<string>): void {
  for (const [, code] of content.matchAll(/<style[^>]*>(.*?)<\/style>/gs)) {
    if (code) {
      set.add(code);
    }
  }
}

export default function postprocessHeaders(): AstroIntegration {
  let config: AstroConfig;

  return {
    name: 'vp-postprocess-headers',
    hooks: {
      'astro:config:done': (options) => {
        ({ config } = options);
      },
      'astro:build:done': async () => {
        const enableExpires = !!env.VP_ENABLE_EXPIRES_HEADER;

        const outDir = fileURLToPath(config.outDir);
        const headersFilepath = path.join(outDir, HEADERS_FILENAME);

        const scriptSet = new Set<string>();
        const styleSet = new Set<string>();

        const htmlFilenames = await fg('**/*.{html,htm}', {
          cwd: outDir,
        });
        await asyncForeach(
          htmlFilenames,
          async (filename) => {
            const content = await fsp.readFile(
              path.join(outDir, filename),
              'utf-8'
            );
            extractScripts(content, scriptSet);
            extractStyles(content, styleSet);
          },
          CONCURRENCY
        );

        // eslint-disable-next-line no-console
        console.info(`Scanned ${htmlFilenames.length} HTML files`);

        const nextMidnight = new Date();
        nextMidnight.setUTCHours(24, 0, 0, 0);

        const expires = nextMidnight.toUTCString();

        const replacements: Readonly<Record<string, string>> = {
          CSP_HEADER: `Content-Security-Policy: ${CSP_HEADER_VALUE}`,
          EXPIRES_HEADER: `${enableExpires ? '' : '# '}Expires: ${expires}`,
        };

        await fsp.writeFile(
          headersFilepath,
          replaceTemplates(
            await fsp.readFile(headersFilepath, 'utf-8'),
            replacements
          )
        );

        // eslint-disable-next-line no-console
        console.info(
          `Headers file ${HEADERS_FILENAME} processed with`,
          replacements
        );

        // Cloudflare Pages do not send too long header
        // so we have to embed long parts to the HTML files, rather than headers

        const metaCSPValue = [
          `script-src 'self' 'unsafe-inline' static.cloudflareinsights.com${[
            ...scriptSet,
          ]
            .map((t) => ` ${generateCSPHash(t)}`)
            .sort()
            .join('')}`,
          /*
          // we disable style-src hashes as it seems to break some styles
          `style-src 'self' 'unsafe-inline'${[...styleSet]
            .map((t) => ` ${generateCSPHash(t)}`)
            .sort()
            .join('')}`,
          //*/
        ].join('; ');

        const cspTag = `<meta content="${metaCSPValue}" http-equiv=Content-Security-Policy>`;
        await asyncForeach(
          htmlFilenames,
          async (filename) => {
            const filepath = path.join(outDir, filename);
            const content = await fsp.readFile(filepath, 'utf-8');
            await fsp.writeFile(
              filepath,
              content.replace('<!--#__CSP_PLACEHOLDER__#-->', cspTag)
            );
          },
          CONCURRENCY
        );

        // eslint-disable-next-line no-console
        console.info(`Processed ${htmlFilenames.length} HTML files`);
      },
    },
  };
}
