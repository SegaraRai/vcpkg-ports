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

export const SEARCH_MAX_RESULTS_FOR_OVERLAY = 5;
export const SEARCH_MAX_RESULTS_FOR_PAGE = 40;

export const SEARCH_RANDOM_MAX_RESULTS = SEARCH_MAX_RESULTS_FOR_PAGE;

export const SEARCH_PAGE_QUERY_KEY = 'q';

//

export const SITE_TITLE = 'Vcpkg Ports';
export const SITE_DESCRIPTION =
  'Easily browse and explore the ports in the vcpkg.';
export const SITE_LANGUAGE_SNAKE = 'en_US';
export const SITE_LANGUAGE_KEBAB = 'en-US';

export const DEFAULT_OG_IMAGE_URL = '/og.png';

// NOTE: we don't have public Twitter account

export function formatPageTitle(pageTitle: string | null | undefined): string {
  return pageTitle ? `${pageTitle} 📦 ${SITE_TITLE}` : SITE_TITLE;
}
