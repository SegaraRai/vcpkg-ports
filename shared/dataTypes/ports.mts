import type { Vcpkg } from "../vcpkg/schema.mjs";

export interface DataPortsPort {
  readonly name: string;
  readonly manifest: Vcpkg;
  readonly files: readonly string[];
}

export interface DataPorts {
  readonly version: string;
  readonly ports: readonly DataPortsPort[];
}
