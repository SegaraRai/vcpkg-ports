declare module "subset-font" {
  export interface SubsetFontOptions {
    readonly targetFormat?: "sfnt" | "woff" | "woff2" | undefined;
    readonly preserveNameIds?: readonly number[] | undefined;
  }

  export default function subsetFont(
    buffer: Buffer,
    text: string,
    options?: SubsetFontOptions
  ): Promise<Buffer>;
}
