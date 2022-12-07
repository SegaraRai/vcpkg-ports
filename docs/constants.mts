import { portNameToFilename } from '../shared/pageConstants.mjs';

export const PAGE_EXTENSION: '.html' | '' = '';

export const VCPKG_REPO_URL = 'https://github.com/microsoft/vcpkg';

export const VCPKG_PORTS_REPO_URL = 'https://github.com/SegaraRai/vcpkg-ports';

/** whether to use `master` or HEAD for GitHub links */
export const VCPKG_REF_OVERRIDE: 'master' | null = null;

export const CONTRIBUTOR_IMAGE_SIZE = 64;

export const CHANGELOG_NON_COLLAPSE_ITEMS = 10;
export const CHANGELOG_COLLAPSE_THRESHOLD = CHANGELOG_NON_COLLAPSE_ITEMS + 5;

export const OFFSET_FOR_ACTIVE_ANCHOR = -120;

export const SEARCH_NUM_EXAMPLE_TERMS_SHOWN = 4;
export const SEARCH_EXAMPLE_TERMS = [
  'async',
  'compress',
  'constexpr',
  'FFT',
  'gui',
  'header-only',
  'image',
  'javascript',
  'json',
  'log',
  'opencv',
  'physics',
  'template',
  'websocket',
] as const;

export const SEARCH_MAX_RESULTS_FOR_SUGGEST = 10;
export const SEARCH_MAX_RESULTS_FOR_POPUP = 5;
export const SEARCH_MAX_RESULTS_FOR_PAGE = 500;
export const SEARCH_MAX_RESULTS_PER_PAGE = 100;

export const SEARCH_RANDOM_MAX_RESULTS = SEARCH_MAX_RESULTS_PER_PAGE;

export const SEARCH_PAGE_PAGE_KEY = 'page';
export const SEARCH_PAGE_QUERY_KEY = 'q';

//

export const SITE_TITLE = 'Vcpkg Ports';
export const SITE_DESCRIPTION =
  'Easily browse and explore the ports in the vcpkg.';
export const SITE_LANGUAGE_SNAKE = 'en_US';
export const SITE_LANGUAGE_KEBAB = 'en-US';

export const DEFAULT_OG_IMAGE_URL = '/og.png';

// NOTE: we don't have public Twitter account

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

export function formatPageTitle(pageTitle: string | null | undefined): string {
  return pageTitle ? `${pageTitle} 📦 ${SITE_TITLE}` : SITE_TITLE;
}

export const getSearchPageURL = (
  term: string,
  p = 1,
  relative = false
): string =>
  `${
    relative ? '' : `/search${PAGE_EXTENSION}`
  }#${SEARCH_PAGE_QUERY_KEY}=${encodeURIComponent(term)}${
    p > 1 ? `&${SEARCH_PAGE_PAGE_KEY}=${p}` : ''
  }`;
