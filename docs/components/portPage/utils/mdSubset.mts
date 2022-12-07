import LinkifyIt from 'linkify-it';
import { VCPKG_REPO_URL } from '../../../constants.mjs';
import { escapeAll, renderExternalLink } from './htmlUtils.mjs';

function replaceAndTransform<T>(
  text: string,
  regex: RegExp,
  transformer: (chunk: string) => T
): (T | string)[] {
  return text
    .split(regex)
    .map((chunk, i) => (i % 2 ? transformer(chunk) : chunk));
}

type ChunkOrString = string | Chunk;
interface Chunk {
  readonly type: string;
  readonly chunks: readonly ChunkOrString[];
  readonly render: (text: string) => string;
}

function applyTransform<T extends Chunk>(
  chunk: T,
  transformer: (chunk: string) => readonly ChunkOrString[]
): T {
  return {
    ...chunk,
    chunks: chunk.chunks.flatMap((subChunk) =>
      typeof subChunk === 'string'
        ? transformer(subChunk)
        : applyTransform(subChunk, transformer)
    ),
  };
}

function applyTransformRegExp<T extends Chunk>(
  chunk: T,
  regex: RegExp,
  transformer: (chunk: string) => ChunkOrString
): T {
  return applyTransform<T>(chunk, (subChunk) =>
    replaceAndTransform(subChunk, regex, transformer)
  );
}

function renderChunk(
  chunk: ChunkOrString,
  stringTransformer: (text: string) => string
): string {
  return typeof chunk === 'string'
    ? stringTransformer(chunk)
    : chunk.render(
        chunk.chunks
          .map((subChunk) => renderChunk(subChunk, stringTransformer))
          .join('')
      );
}

export interface RenderMarkdownSubsetOptions {
  readonly linkify?: boolean | undefined;
  readonly inlineCodeBlock?: boolean | undefined;
  readonly githubIssues?: boolean | undefined;
  readonly newline?: 'break' | 'space' | undefined;
}

/**
 * Renders a subset of Markdown to HTML. \
 * Supported Markdown:
 * - Inline code blocks
 * - Links (explicit linking and linkify)
 * - Github issues
 * @param text The markdown text to render.
 * @param options Enable or disable certain features.
 * @returns The rendered HTML.
 */
export function renderMarkdownSubset(
  text: string,
  options: RenderMarkdownSubsetOptions = {
    linkify: true,
    inlineCodeBlock: true,
    githubIssues: false,
    newline: 'space',
  }
): string {
  const { linkify, inlineCodeBlock, githubIssues, newline } = options;
  let rootChunk: Chunk = {
    type: 'root',
    chunks: [text],
    render: (text) => text,
  };
  if (inlineCodeBlock) {
    const unwrapInlineCodeBlock = (text: string): string =>
      text.startsWith('``') ? text.slice(2, -2) : text.slice(1, -1);
    rootChunk = applyTransformRegExp(
      rootChunk,
      /(?<![A-Za-z\d])(`[^`]+`|``.+?``)/,
      (chunk) => ({
        type: 'inlineCodeBlock',
        chunks: [], // empty chunks means no further processing
        render: () => `<code>${escapeAll(unwrapInlineCodeBlock(chunk))}</code>`,
      })
    );
  }
  if (githubIssues) {
    rootChunk = applyTransformRegExp(
      rootChunk,
      /(?<![A-Za-z\d&/])(#\d+)\b/,
      (chunk) => ({
        type: 'githubIssueLink',
        chunks: [], // empty chunks means no further processing
        render: () =>
          renderExternalLink(`${VCPKG_REPO_URL}/pull/${chunk.slice(1)}`, chunk),
      })
    );
  }
  if (linkify) {
    // explicit link syntax (<https://www.example.org/>)
    // this must be done before the linkify step
    rootChunk = applyTransformRegExp(
      rootChunk,
      /<(https?:\/\/[^>]+)>/,
      (chunk) => ({
        type: 'explicitLink',
        chunks: [], // empty chunks means no further processing
        render: () => renderExternalLink(chunk, chunk),
      })
    );
    // linkify
    const linkifyInstance = new LinkifyIt({
      fuzzyEmail: false,
      fuzzyIP: false,
      fuzzyLink: false,
    });
    // only allow http:// and https:// links
    linkifyInstance.add('ftp:', null).add('//', null).add('mailto:', null);
    rootChunk = applyTransform(rootChunk, (chunk) => {
      const chunks: ChunkOrString[] = [];
      let consumed = 0;
      for (const result of linkifyInstance.match(chunk) || []) {
        const { index, lastIndex, url, raw } = result;
        if (index > consumed) {
          chunks.push(chunk.slice(consumed, index));
        }
        chunks.push({
          type: 'linkifyLink',
          chunks: [], // empty chunks means no further processing
          render: () => renderExternalLink(url, raw),
        });
        consumed = lastIndex;
      }
      if (consumed < chunk.length) {
        chunks.push(chunk.slice(consumed));
      }
      return chunks;
    });
  }
  return renderChunk(rootChunk, (text) =>
    escapeAll(text, newline === 'break', true)
      .replaceAll('\n', '<br />')
      .replaceAll('&#10;', '<br />')
  );
}
