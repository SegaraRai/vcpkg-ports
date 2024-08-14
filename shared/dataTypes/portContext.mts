import type { Vcpkg } from "../vcpkg/schema.mjs";

export interface PortContext {
  readonly name: string;
  readonly version: string;
  readonly description: string;
  readonly shortDescription: string;
  readonly createdAt: string;
  readonly modifiedAt: string;
  readonly ogImageFilename?: string | undefined;
  readonly manifest: Vcpkg;
  readonly commits: readonly string[];
  readonly normalDependents: readonly string[];
  readonly hostDependents: readonly string[];
  readonly files: readonly string[];
  readonly fileContents: readonly (readonly [
    filename: string,
    content: string,
  ])[];
  readonly inferredCopyrightURLs: readonly string[];
}
