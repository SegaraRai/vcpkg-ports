export const VCPKG_REPO_URL = 'https://github.com/microsoft/vcpkg';

export const VCPKG_PORTS_REPO_URL = 'https://github.com/SegaraRai/vcpkg-ports';

/** whether to use `master` or HEAD for GitHub links */
export const VCPKG_REF_OVERRIDE: 'master' | null = null;

export const CONTRIBUTOR_IMAGE_SIZE = 64;

export const CHANGELOG_NON_COLLAPSE_ITEMS = 10;
export const CHANGELOG_COLLAPSE_THRESHOLD = CHANGELOG_NON_COLLAPSE_ITEMS + 5;

export const PAGE_EXTENSION: '.html' | '' = '';

export const PORT_OG_IMAGE_PATH = '/assets/og';

export function portNameToFilename(portName: string): string {
  return portName === 'index' ? 'index_' : portName;
}

export function filenameToPortName(filename: string): string {
  return filename === 'index_' ? 'index' : filename;
}

export function portNameToOGImageFilename(
  portName: string,
  hash: string
): string {
  return `${portName}-${hash}.png`;
}

export function slugify(text: string): string {
  return text
    .normalize()
    .toLowerCase()
    .replace(/[^a-z\d]+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

export function getFeatureSlug(featureName: string): string {
  return slugify(`features-${slugify(featureName)}`);
}

export function getPortPageURL(portName: string, featureName?: string): string {
  return `/ports/${portNameToFilename(portName)}${PAGE_EXTENSION}${
    featureName ? `#${getFeatureSlug(featureName)}` : ''
  }`;
}

export function getFallbackDescription(portName: string): string {
  return portName.includes('vcpkg')
    ? portName
    : `A port of ${portName} to vcpkg`;
}
