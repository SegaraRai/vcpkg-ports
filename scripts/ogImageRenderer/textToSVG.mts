import type { Font, GlyphRun } from 'fontkit';
import { renderNumber } from './svgUtils.mjs';
import { textToLinesWithEllipsis } from './textToLines.mjs';

export interface SVGWithSize {
  readonly svg: string;
  readonly width: number;
  readonly height: number;
}

export function pxToUnits(px: number, font: Font, fontSize: number): number {
  return (px * font.unitsPerEm) / fontSize;
}

export function unitsToPx(units: number, font: Font, fontSize: number): number {
  return (units * fontSize) / font.unitsPerEm;
}

export function getLineSpaceInUnits(font: Font): number {
  return font.ascent - font.descent + font.lineGap;
}

export function textToGlyphRuns(
  text: string,
  maxWidth: number,
  maxLines: number,
  layoutCallback: (text: string) => GlyphRun,
  ellipsis = '…',
  strict = false
): GlyphRun[] {
  return textToLinesWithEllipsis(
    text,
    (chunk) => layoutCallback(chunk.trim()).advanceWidth > maxWidth,
    maxLines,
    ellipsis,
    strict
  ).map((line) => layoutCallback(line.trim()));
}

/**
 * @param font  The font to use for the text.
 * @param fontSize font size in px
 * @param glyphRuns The lines to render.
 * @param lineHeight if positive, line height scale (`line-height` property of css). if negative, line height in px.
 * @param calcXOffset callback to calculate x offset of each line
 */
export function glyphRunsToSVG(
  font: Font,
  fontSize: number,
  glyphRuns: readonly GlyphRun[],
  lineHeight: number,
  calcXOffset: (lineWidthInPx: number, lineIndex: number) => number = () => 0
): SVGWithSize {
  const lineSpaceInUnits =
    lineHeight >= 0
      ? getLineSpaceInUnits(font) * lineHeight
      : pxToUnits(-lineHeight, font, fontSize);

  const svgLines: string[] = [];
  let widthInUnits = 0;
  for (const [lineIndex, glyphRun] of glyphRuns.entries()) {
    const y = lineSpaceInUnits * lineIndex;
    const lineX = pxToUnits(
      calcXOffset(unitsToPx(glyphRun.advanceWidth, font, fontSize), lineIndex),
      font,
      fontSize
    );
    widthInUnits = Math.max(widthInUnits, lineX + glyphRun.advanceWidth);
    for (let i = 0, x = lineX; i < glyphRun.positions.length; i++) {
      const glyph = glyphRun.glyphs[i];
      const position = glyphRun.positions[i];
      const path = glyph.path.toSVG();
      if (path) {
        // we cannot use transform-origin since it's SVG2 feature so we have to add font.unitsPerEm to y position
        // https://github.com/lovell/sharp/issues/2884
        svgLines.push(
          `<path transform="translate(${renderNumber(
            x + position.xOffset
          )},${renderNumber(
            y + position.yOffset + font.unitsPerEm
          )}) scale(1,-1)" d="${glyph.path.toSVG()}" />`
        );
      }
      x += position.xAdvance;
    }
  }

  const heightInUnits = lineSpaceInUnits * glyphRuns.length;
  const width = unitsToPx(widthInUnits, font, fontSize);
  const height = unitsToPx(heightInUnits, font, fontSize);
  const scale = fontSize / font.unitsPerEm;
  return {
    svg: `<g transform="scale(${renderNumber(scale)},${renderNumber(
      scale
    )})">\n${svgLines.join('\n')}\n</g>`,
    width,
    height,
  };
}

export function textToSVG(
  text: string,
  font: Font,
  fontSize: number,
  maxWidth: number,
  maxLines: number,
  lineHeight: number,
  alignment: 'left' | 'center' | 'right' = 'left',
  layoutCallback?: (text: string) => GlyphRun,
  ellipsis = '…',
  strict = false
): SVGWithSize {
  const offsetScale =
    alignment === 'right' ? 1 : alignment === 'center' ? 0.5 : 0;
  const glyphRuns = textToGlyphRuns(
    text,
    pxToUnits(maxWidth, font, fontSize),
    maxLines,
    layoutCallback || ((text) => font.layout(text)),
    ellipsis,
    strict
  );
  const result = glyphRunsToSVG(
    font,
    fontSize,
    glyphRuns,
    lineHeight,
    (lineWidth) => (maxWidth - lineWidth) * offsetScale
  );
  return {
    ...result,
    width:
      alignment === 'center' ? Math.max(result.width, maxWidth) : result.width,
  };
}
