export const PORT_OG_IMAGE_PATH = "/assets/og";

export function portNameToFilename(portName: string): string {
  return portName === "index" ? "index_" : portName;
}

export function filenameToPortName(filename: string): string {
  return filename === "index_" ? "index" : filename;
}

export function portNameToOGImageFilename(
  portName: string,
  hash: string
): string {
  return `${portName}-${hash}.png`;
}
