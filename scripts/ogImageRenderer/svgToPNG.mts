import sharp from 'sharp';

export function svgToPNG(
  svg: string,
  width: number,
  height: number
): Promise<Buffer> {
  return sharp(Buffer.from(svg, 'utf-8'))
    .resize(width, height)
    .png({
      compressionLevel: 9,
    })
    .toBuffer();
}
