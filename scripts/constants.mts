import { cpus } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const PROJECT_DIR = fileURLToPath(new URL("..", import.meta.url));

export const VCPKG_DIR = path.join(PROJECT_DIR, ".vcpkg");

export const DIST_DATA_DIR = path.join(PROJECT_DIR, "data");
export const DATA_HISTORY_FILE = path.join(DIST_DATA_DIR, "vcpkg-history.json");
export const DATA_PORTS_FILE = path.join(DIST_DATA_DIR, "vcpkg-ports.json");
export const DATA_VERSION_FILE = path.join(DIST_DATA_DIR, "vcpkg-version.json");

export const OG_FONTS_DIR = path.join(PROJECT_DIR, "fonts/og");
export const SRC_FONTS_DIR = path.join(PROJECT_DIR, "fonts/docs");
export const DIST_FONTS_DIR = path.join(PROJECT_DIR, "docs/fonts");

export const DIST_PORT_OG_DIR = path.join(PROJECT_DIR, "og");
export const DIST_PORT_OG_IMAGE_DIR = path.join(DIST_PORT_OG_DIR, "ports");
export const DATA_PORT_OG_INDEX_FILE = path.join(
  DIST_PORT_OG_DIR,
  "index.json"
);

export const CONCURRENCY = cpus().length;

export const CSP_HEADER_VALUE = [
  "default-src 'none'",
  "base-uri 'none'",
  "frame-ancestors 'none'",
  "connect-src 'self' cloudflareinsights.com",
  "prefetch-src 'self'",
  "manifest-src 'self'",
  "font-src 'self' data:",
  "img-src 'self' data: avatars.githubusercontent.com www.gravatar.com",
  "script-src 'self' 'unsafe-inline' static.cloudflareinsights.com",
  "style-src 'self' 'unsafe-inline'",
].join("; ");
