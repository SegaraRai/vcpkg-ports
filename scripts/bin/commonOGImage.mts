import { type Font, open } from "fontkit";
import fsp from "node:fs/promises";
import path from "node:path";
import { OG_FONTS_DIR } from "../constants.mjs";
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  RASTERIZE_SCALE,
} from "../ogImageRenderer/ogRenderer.mjs";
import { calcPosition } from "../ogImageRenderer/positionUtils.mjs";
import { svgToPNG } from "../ogImageRenderer/svgToPNG.mjs";
import { textToSVG } from "../ogImageRenderer/textToSVG.mjs";

const FONT_FILE = "Barlow-Bold.ttf";
const FONT_SIZE = 100;
const TEXT = "Vcpkg Ports";
const FEATURES = ["kern", "liga", "calt", "pnum"] as const;
const LOGO_SIZE = 300;
const PADDING_TOP = 100;
const PADDING_BOTTOM = PADDING_TOP + 10;
const BAR_HEIGHT = 150;
const BG_COLOR = "#fafdfe";
const BG_ACCENT_COLOR = "#fc971c";
const TEXT_COLOR = "#252525";

function loadFont(filename: string): Promise<Font> {
  return open(path.join(OG_FONTS_DIR, filename)) as Promise<Font>;
}

async function renderSVG(): Promise<string> {
  const font = await loadFont(FONT_FILE);

  const svgLines: string[] = [
    `<rect width="${CANVAS_WIDTH}" height="${CANVAS_HEIGHT}" fill="${BG_COLOR}" />`,
    `<rect width="${
      CANVAS_WIDTH * 2
    }" height="${BAR_HEIGHT}" x="-400" y="110" fill="${BG_ACCENT_COLOR}" transform="rotate(-45)" />`,
    `<rect width="${CANVAS_WIDTH * 2}" height="${BAR_HEIGHT}" x="-200" y="${
      CANVAS_HEIGHT + 520
    }" fill="${BG_ACCENT_COLOR}" transform="rotate(-45)" />`,
    (await fsp.readFile("public/favicon.svg", "utf-8")).replace(
      /^\s*<svg\s[^>]*(viewBox="[^"]+")[^>]*>/i,
      `<svg x="${
        (CANVAS_WIDTH - LOGO_SIZE) / 2
      }" y="${PADDING_TOP}" width="${LOGO_SIZE}" height="${LOGO_SIZE}" $1>`
    ),
  ];

  {
    const { width, height, svg } = textToSVG(
      TEXT,
      font,
      FONT_SIZE,
      CANVAS_WIDTH,
      1,
      1,
      "center",
      (text) => font.layout(text, FEATURES.slice())
    );
    const { x, y } = calcPosition(
      {
        left: 0,
        right: 0,
        bottom: PADDING_BOTTOM,
      },
      width,
      height,
      CANVAS_WIDTH,
      CANVAS_HEIGHT
    );
    svgLines.push(
      `<g transform="translate(${x},${y})" fill="${TEXT_COLOR}">\n${svg}\n</g>`
    );
  }

  return `<svg viewBox="0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}" width="${CANVAS_WIDTH}" height="${CANVAS_HEIGHT}" xmlns="http://www.w3.org/2000/svg">\n${svgLines.join(
    "\n"
  )}\n</svg>`;
}

const png = await svgToPNG(
  await renderSVG(),
  Math.round(CANVAS_WIDTH * RASTERIZE_SCALE),
  Math.round(CANVAS_HEIGHT * RASTERIZE_SCALE)
);

await fsp.writeFile("public/og.png", png);
