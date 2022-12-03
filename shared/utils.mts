export function compareString(a: string, b: string): number {
  return a === b ? 0 : a > b ? 1 : -1;
}

export function toArray<T>(x: T | T[]): T[] {
  return Array.isArray(x) ? x : [x];
}

export function toUniqueArray<T>(array: readonly T[]): T[] {
  return Array.from(new Set(array));
}

export function shortenCommitId(oid: string): string {
  return oid.slice(0, 7);
}

export function normalizeText(str: string): string {
  return str.normalize().replace(/\r\n?|[\v\f\u0085\u2028\u2029]/g, '\n');
}

export function getContributorAvatarURL(
  emailHash: string,
  githubUser: string | null,
  size: number,
  gravatarStyle:
    | 'mp'
    | 'identicon'
    | 'monsterid'
    | 'wavatar'
    | 'retro'
    | 'robohash'
    | 'blank' = 'retro'
): string {
  const match = githubUser?.match(/^(?:(\d+)\+)?([A-Za-z\d-]+)$/);
  // GitHub
  if (
    // noreply@github.com
    emailHash === '9181eb84f9c35729a3bad740fb7f9d93' ||
    // GitHub Actions
    match?.[1] === '41898282' ||
    match?.[2] === 'github-actions' ||
    match?.[2] === 'github-actions[bot]'
  ) {
    return `https://avatars.githubusercontent.com/in/15368?s=${size}&v=4`;
  }
  // GitHub user
  if (match) {
    return match[1]
      ? `https://avatars.githubusercontent.com/u/${match[1]}?s=${size}&v=4`
      : `https://avatars.githubusercontent.com/${match[2]}?s=${size}&v=4`;
  }
  // Gravatar
  return `https://www.gravatar.com/avatar/${emailHash}?d=${gravatarStyle}&s=${size}`;
}

export function pickRandom<T>(array: readonly T[], max = array.length): T[] {
  const results: T[] = [];
  const items = array.slice();
  for (let i = 0; i < max && items.length; i++) {
    results.push(items.splice(Math.floor(Math.random() * items.length), 1)[0]);
  }
  return results;
}

export function isFileIncludedInPortContext(filename: string): boolean {
  return /^license|^usage$/i.test(filename);
}
