export interface Context {
  readonly splittedLines: readonly (readonly string[])[];
  readonly splittedLineIndex: number;
  readonly splittedWords: readonly string[];
  readonly splittedWordIndex: number;
  readonly renderedLines: readonly string[];
  readonly currentLine: string;
  readonly currentLineIndex: number;
  readonly wordTooLong: boolean;
}

export type OverflowCallback = (chunk: string, context: Context) => boolean;

export type OnWordTooLongCallback = (
  wordTruncated: string,
  wordRemaining: string,
  context: Context
) => readonly string[];

/**
 * puts truncated word and hyphen on the line and the rest on the next line \
 * hyphenation algorithm is not so good; users should provide their own \
 * `VeryLongWordThatOverflowsLineByItself` -> `VeryLongWordThatOverflow-\nsLineByItself`
 * @param ellipsis ellipsis to use
 * @returns callback to use with `textToLines`
 */
export function createOnWordTooLongHyphenate(
  hyphen = '-'
): OnWordTooLongCallback {
  return (truncated, remaining) => [truncated + hyphen, remaining];
}

/**
 * puts truncated word and ellipsis on the line and discards the rest of the word \
 * `VeryLongWordThatOverflowsLineByItself` -> `VeryLongWordThatOverflow…`
 * @param ellipsis ellipsis to use
 * @returns callback to use with `textToLines`
 */
export function createOnWordTooLongEllipsis(
  ellipsis = '…'
): OnWordTooLongCallback {
  return (truncated) => [truncated + ellipsis];
}

/**
 * just puts whole word on the line (overflows line)
 * @param joiner joiner to use
 * @returns callback to use with `textToLines`
 */
export function createOnWordTooLongPlaceWhole(
  joiner = ''
): OnWordTooLongCallback {
  return (truncated, remaining) => [truncated + joiner + remaining];
}

/**
 * splits text into lines with word wrapping
 * @param text text
 * @param overflow callback to determine if line is overflowing
 * @param onWordTooLong callback to determine how to handle words that are too long to fit on a line
 * @returns lines
 */
export function textToLines(
  text: string,
  overflow: OverflowCallback,
  onWordTooLong: OnWordTooLongCallback
): string[] {
  const splittedLines: string[][] = text
    .split('\n')
    .map((line) => line.match(/[^\s-]*[\s-]*/g) ?? []);
  const lines: string[] = [];
  for (const [splittedLineIndex, splittedWords] of splittedLines.entries()) {
    let line = '';
    for (const [splittedWordIndex, splittedWord] of splittedWords.entries()) {
      const context: Context = {
        splittedLines,
        splittedLineIndex,
        splittedWords,
        splittedWordIndex,
        renderedLines: lines,
        currentLine: line,
        currentLineIndex: lines.length,
        wordTooLong: false,
      };
      if (overflow(line + splittedWord, context)) {
        if (!line) {
          // word too long
          // use spread operator to deal with surrogate pairs
          const remaining = [...splittedWord];
          let truncatedWord = '';
          while (
            remaining.length &&
            !overflow(truncatedWord + remaining[0], {
              ...context,
              wordTooLong: true,
            })
          ) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            truncatedWord += remaining.shift()!;
          }
          // NOTE: recursive overflow check is currently not supported
          const result = onWordTooLong(truncatedWord, remaining.join(''), {
            ...context,
            wordTooLong: true,
          }).slice();
          line = result.pop() ?? '';
          lines.push(...result);
          continue;
        }

        // normal overflow
        lines.push(line);
        line = '';
      }
      line += splittedWord;
    }
    lines.push(line);
  }
  return lines;
}

/**
 * splits text into lines, with word wrapping, with ellipsis
 * @param text text to split into lines
 * @param overflow callback to check if line overflows
 * @param maxLines maximum number of lines to return
 * @param ellipsis ellipsis to use
 * @param strict if true, will account for ellipsis in line length
 * @param onWordTooLong callback to handle words that are too long to fit on a line
 * @returns lines
 */
export function textToLinesWithEllipsis(
  text: string,
  overflow: OverflowCallback,
  maxLines: number,
  ellipsis = '…',
  strict = false,
  onWordTooLong = createOnWordTooLongEllipsis(ellipsis)
): string[] {
  const memo = new Map<string, boolean>();
  const memoOverflow: OverflowCallback = (chunk, context) => {
    const key = JSON.stringify({ chunk, context });
    let result = memo.get(key);
    if (result == null) {
      result = overflow(chunk, context);
      memo.set(key, result);
    }
    return result;
  };

  const lines = textToLines(
    text,
    (chunk, context) => {
      // skip calling overflow if we already know we're going to overflow (performance optimization)
      if (context.currentLineIndex >= maxLines) {
        return false;
      }

      let accountForEllipsis: boolean;
      if (!strict) {
        // if we're NOT strict, we don't account for ellipsis
        accountForEllipsis = false;
      } else if (context.wordTooLong) {
        // if we're strict, and we're dealing with a word that's too long, we account for ellipsis
        accountForEllipsis = true;
      } else if (context.currentLineIndex !== maxLines - 1) {
        // if we're strict, and we're NOT on the last line, we don't account for ellipsis
        accountForEllipsis = false;
      } else if (
        context.splittedLineIndex !==
        context.splittedLines.length - 1
      ) {
        // if we're strict, and we're on the last line, and there are more lines after this one, we account for ellipsis
        accountForEllipsis = true;
      } else {
        // if we're strict, and we're on the last line, and there are NO more lines after this one
        if (
          !memoOverflow(
            context.splittedLines[context.splittedLineIndex].join(''),
            {
              ...context,
              splittedWordIndex: context.splittedWords.length - 1,
            }
          )
        ) {
          // if the whole line fits, we can return false, meaning there are no overflows
          return false;
        }

        // if the whole line doesn't fit, we account for ellipsis
        accountForEllipsis = true;
      }

      return overflow(accountForEllipsis ? chunk + ellipsis : chunk, context);
    },
    onWordTooLong
  );
  if (lines.length > maxLines) {
    lines.splice(maxLines);
    while (lines.length) {
      const lastLine = lines.pop();
      if (lastLine) {
        lines.push(
          lastLine.endsWith(ellipsis) ? lastLine : `${lastLine}${ellipsis}`
        );
        break;
      }
    }
  }
  return lines;
}
