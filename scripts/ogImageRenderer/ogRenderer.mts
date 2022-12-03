import fsp from 'node:fs/promises';
import path from 'node:path';
import { Font, open } from 'fontkit';
import type { DataPorts } from '../../shared/dataTypes/ports.mjs';
import {
  getPortVersionText,
  getShortPortDescription,
} from '../../shared/vcpkg/portUtils.mjs';
import type { Vcpkg } from '../../shared/vcpkg/schema.mjs';
import { DATA_PORTS_FILE, OG_FONTS_DIR } from '../constants.mjs';
import { FixedPositionSpec, calcPosition } from './positionUtils.mjs';
import { svgToPNG } from './svgToPNG.mjs';
import { renderNumber } from './svgUtils.mjs';
import { SVGWithSize, textToSVG } from './textToSVG.mjs';

export interface PortFonts {
  readonly BarlowBold: Font;
  readonly PTRootUIMedium: Font;
  readonly RobotoMedium: Font;
  readonly RobotoRegular: Font;
}

export type PortFontName = keyof PortFonts;

interface FontSpec {
  readonly color?: string | undefined;
  readonly opacity?: string | number | undefined;
  readonly font: PortFontName;
  readonly fontSize: number;
  readonly lineHeight: number;
  readonly maxWidth: number;
  readonly maxLines: number;
  readonly alignment?: 'left' | 'center' | 'right' | undefined;
  readonly features?: readonly string[] | undefined;
  readonly strictOverflow?: boolean;
}

interface TextSpecFlow extends FontSpec {
  readonly paddingTop: number;
}

interface TextSpecFixed extends FontSpec, FixedPositionSpec {}

export const CANVAS_WIDTH = 1200;
export const CANVAS_HEIGHT = 630;
export const RASTERIZE_SCALE = 1.2;

const FONT_FEATURES_TITLE = ['kern', 'liga', 'calt', 'pnum'] as const;
const FONT_FEATURES_VERSION = ['kern', 'liga', 'calt', 'tnum'] as const;
const FONT_FEATURES_BODY = FONT_FEATURES_TITLE;
const FONT_FEATURES_LOGO = FONT_FEATURES_BODY;
const BG_COLOR = '#fafdfe';
const BG_ACCENT_COLOR = '#fc971c';
const TEXT_LEFT = 60;
const TEXT_BOX_WIDTH = CANVAS_WIDTH - TEXT_LEFT * 2;
const TEXT_STRICT_OVERFLOW = false;
const TEXT_SPEC_TITLE: TextSpecFlow = {
  color: '#121212',
  font: 'PTRootUIMedium',
  fontSize: 90,
  lineHeight: 0.8,
  maxWidth: TEXT_BOX_WIDTH,
  maxLines: 2,
  paddingTop: 40,
  features: FONT_FEATURES_TITLE,
  strictOverflow: TEXT_STRICT_OVERFLOW,
};
const TEXT_SPEC_VERSION: TextSpecFlow = {
  color: '#565656',
  font: 'RobotoRegular',
  fontSize: 50,
  lineHeight: 0.9,
  maxWidth: TEXT_BOX_WIDTH,
  maxLines: 1,
  paddingTop: 15,
  features: FONT_FEATURES_VERSION,
  strictOverflow: TEXT_STRICT_OVERFLOW,
};
const TEXT_SPEC_DESCRIPTION: TextSpecFlow = {
  color: '#272727',
  font: 'RobotoMedium',
  fontSize: 60,
  lineHeight: 1.1,
  maxWidth: TEXT_BOX_WIDTH,
  maxLines: 0, // auto
  paddingTop: 40,
  features: FONT_FEATURES_BODY,
  strictOverflow: TEXT_STRICT_OVERFLOW,
};
const TEXT_SPEC_VCPKG: TextSpecFixed = {
  color: BG_COLOR,
  font: 'BarlowBold',
  fontSize: 50,
  lineHeight: 1,
  maxWidth: TEXT_BOX_WIDTH,
  maxLines: 1,
  alignment: 'right', // actually `alignment` does not matter for single line fixed position text
  right: TEXT_LEFT,
  bottom: 50,
  features: FONT_FEATURES_LOGO,
  strictOverflow: TEXT_STRICT_OVERFLOW,
};
const TEXT_MAX_BOTTOM =
  CANVAS_HEIGHT -
  TEXT_SPEC_VCPKG.bottom! * 2 -
  TEXT_SPEC_VCPKG.fontSize * TEXT_SPEC_VCPKG.lineHeight;
const SVG_PREPENDS = [
  `<rect width="${CANVAS_WIDTH}" height="${CANVAS_HEIGHT}" fill="${BG_COLOR}" />`,
  `<rect width="${CANVAS_WIDTH}" height="${TEXT_SPEC_VCPKG.fontSize + 20}" y="${
    CANVAS_HEIGHT -
    (TEXT_SPEC_VCPKG.bottom! - 10) -
    (TEXT_SPEC_VCPKG.fontSize + 20)
  }" fill="${BG_ACCENT_COLOR}" />`,
];

function loadFont(filename: string): Promise<Font> {
  return open(path.join(OG_FONTS_DIR, filename));
}

function specAndTextToSVG(
  text: string,
  spec: FontSpec,
  portFonts: PortFonts
): SVGWithSize {
  const font = portFonts[spec.font];
  const features = spec.features ? spec.features.slice() : undefined;
  return textToSVG(
    text,
    font,
    spec.fontSize,
    spec.maxWidth,
    spec.maxLines,
    spec.lineHeight,
    spec.alignment,
    (text) => font.layout(text, features),
    '…',
    spec.strictOverflow
  );
}

function createSVGLine(
  svg: string,
  x: number,
  y: number,
  spec: FontSpec
): string {
  return `<g transform="translate(${renderNumber(x)},${renderNumber(y)})"${
    spec.color ? ` fill="${spec.color}"` : ''
  }${spec.opacity != null ? ` opacity="${spec.opacity}"` : ''}>\n${svg}\n</g>`;
}

export function createPortSVG(manifest: Vcpkg, portFonts: PortFonts): string {
  const { name } = manifest;
  const description = getShortPortDescription(manifest.description);
  const version = `v${getPortVersionText(manifest)}`;

  const svgLines: string[] = [...SVG_PREPENDS];

  for (const [text, spec] of [['Vcpkg Ports', TEXT_SPEC_VCPKG]] as const) {
    const { width, height, svg } = specAndTextToSVG(text, spec, portFonts);
    const { x, y } = calcPosition(
      spec,
      width,
      height,
      CANVAS_WIDTH,
      CANVAS_HEIGHT
    );
    svgLines.push(createSVGLine(svg, x, y, spec));
  }

  {
    const x = TEXT_LEFT;
    let y = 0;
    for (const [text, spec] of [
      [name, TEXT_SPEC_TITLE],
      [version, TEXT_SPEC_VERSION],
      [description, TEXT_SPEC_DESCRIPTION],
    ] as const) {
      y += spec.paddingTop;
      const maxLinesResolved =
        spec.maxLines ||
        Math.floor((TEXT_MAX_BOTTOM - y) / (spec.fontSize * spec.lineHeight));
      const { height, svg } = specAndTextToSVG(
        text,
        {
          ...spec,
          maxLines: maxLinesResolved,
        },
        portFonts
      );
      svgLines.push(createSVGLine(svg, x, y, spec));
      y += height;
    }
  }

  return `<svg viewBox="0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}" width="${CANVAS_WIDTH}" height="${CANVAS_HEIGHT}" xmlns="http://www.w3.org/2000/svg">\n${svgLines.join(
    '\n'
  )}\n</svg>`;
}

export interface PortImageRenderer {
  readonly portNamesPromise: Promise<readonly string[]>;
  renderSVG(portName: string): Promise<string>;
  renderPNG(portName: string): Promise<Buffer>;
}

export function createPortImageRenderer(): PortImageRenderer {
  const dataPromise = (async () => {
    const ports: DataPorts = JSON.parse(
      await fsp.readFile(DATA_PORTS_FILE, 'utf-8')
    );
    const portMap = new Map(ports.ports.map((e) => [e.name, e]));
    const fonts: PortFonts = {
      BarlowBold: await loadFont('Barlow-Bold.ttf'),
      PTRootUIMedium: await loadFont('pt-root-ui_medium.ttf'),
      RobotoMedium: await loadFont('Roboto-Medium.ttf'),
      RobotoRegular: await loadFont('Roboto-Regular.ttf'),
    };
    return {
      ports,
      portMap,
      fonts,
    };
  })();

  const portNamesPromise = dataPromise.then((e) =>
    e.ports.ports.map((e) => e.name)
  );

  const renderSVG = async (portName: string): Promise<string> => {
    const { portMap, fonts } = await dataPromise;
    const port = portMap.get(portName);
    if (!port) {
      throw new Error(`Port ${portName} not found`);
    }
    return createPortSVG(port.manifest, fonts);
  };

  const renderPNG = async (portName: string): Promise<Buffer> =>
    svgToPNG(
      await renderSVG(portName),
      Math.round(CANVAS_WIDTH * RASTERIZE_SCALE),
      Math.round(CANVAS_HEIGHT * RASTERIZE_SCALE)
    );

  return {
    portNamesPromise,
    renderSVG,
    renderPNG,
  };
}
