import type { DataPortsPort } from "./dataTypes/ports.mjs";
import type { DataSearchItem } from "./dataTypes/searchItem.mjs";
import {
  getPortVersionText,
  stringifyPortDescription,
} from "./vcpkg/portUtils.mjs";

export function portToSearchItem({ manifest }: DataPortsPort): DataSearchItem {
  return {
    name: manifest.name,
    version: getPortVersionText(manifest),
    description: stringifyPortDescription(manifest.description),
  };
}
