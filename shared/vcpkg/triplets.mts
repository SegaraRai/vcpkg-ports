import { compareString } from '../utils.mjs';

export type SupportTripletPlatform =
  | 'windows'
  | 'uwp'
  | 'linux'
  | 'osx'
  | 'android'
  | 'emscripten';
export type SupportTripletArch = 'x64' | 'x86' | 'arm' | 'arm64' | 'wasm32';
export type SupportTripletPlatformArch =
  | `${SupportTripletPlatform}-${SupportTripletArch}`
  | 'native';
export type SupportTripletLinkage =
  // though dynamic is not used by vcpkg, we need this to distinguish between static and dynamic
  'dynamic' | 'static';
export type SupportTripletPlatformLinkage =
  | `${SupportTripletPlatform}-${SupportTripletLinkage}`
  | `native-${SupportTripletLinkage}`;

export type FullSupportTriplet =
  `${SupportTripletPlatformArch}-${SupportTripletLinkage}`;

export type SupportTriplet =
  | SupportTripletPlatform
  | SupportTripletPlatformArch
  | SupportTripletPlatformLinkage
  | FullSupportTriplet;

export type ShortSupportTriplet = Exclude<SupportTriplet, FullSupportTriplet>;

export type MinifiedTriplet = readonly [
  name: SupportTriplet,
  extracted: readonly FullSupportTriplet[]
];

// currently only official triplets are checked
// https://github.com/microsoft/vcpkg/tree/master/triplets
export const FULL_TRIPLETS: readonly FullSupportTriplet[] = [
  // 'native-dynamic',
  // 'native-static',
  'windows-x64-dynamic',
  'windows-x64-static',
  'windows-x86-dynamic',
  'windows-x86-static',
  'windows-arm64-dynamic',
  'windows-arm64-static',
  'uwp-x64-dynamic',
  'uwp-x64-static',
  'uwp-arm-dynamic',
  'uwp-arm-static',
  'linux-x64-dynamic',
  'linux-x64-static',
  'osx-x64-dynamic',
  'osx-x64-static',
];

// order is important. larger triplets must be checked first
export const SHORT_TRIPLETS: readonly ShortSupportTriplet[] = [
  // 'native',
  'windows',
  'windows-static',
  'windows-dynamic',
  'windows-x64',
  'windows-x86',
  'windows-arm64',
  'uwp',
  'uwp-static',
  'uwp-dynamic',
  'uwp-x64',
  'uwp-arm',
  'linux',
  'linux-static',
  'linux-dynamic',
  'linux-x64',
  'osx',
  'osx-static',
  'osx-dynamic',
  'osx-x64',
];

export function minifyTriplets(
  triplets: readonly FullSupportTriplet[],
  allTriplets = FULL_TRIPLETS,
  shortTriplets = SHORT_TRIPLETS
): MinifiedTriplet[] {
  const supportMap = new Map<FullSupportTriplet, boolean>(
    allTriplets.map((t) => [t, triplets.includes(t)])
  );

  const addedNameMap = new Map<
    `${ShortSupportTriplet}-`,
    readonly FullSupportTriplet[]
  >();
  const unconsumedTripletSet = new Set<FullSupportTriplet>(triplets);
  for (const shortName of shortTriplets) {
    const superset = shortName.replace(/[^-]+$/, '');
    if (addedNameMap.has(superset as `${ShortSupportTriplet}-`)) {
      continue;
    }

    const elements = shortName.split('-');
    const targetTriplets = allTriplets
      .filter((t) => {
        const temp = t.split('-');
        return elements.every((e) => temp.includes(e));
      })
      .sort();

    const supported =
      targetTriplets.length > 0 &&
      targetTriplets.every((t) => supportMap.get(t));
    if (supported) {
      addedNameMap.set(`${shortName}-`, targetTriplets);

      for (const triplet of targetTriplets) {
        unconsumedTripletSet.delete(triplet);
      }
    }
  }

  return [
    ...Array.from(addedNameMap.entries()).map(
      ([n, ts]) => [n.replace(/-$/, '') as SupportTriplet, ts] as const
    ),
    ...Array.from(unconsumedTripletSet).map((t) => [t, []] as const),
  ].sort(([a], [b]) => compareString(a, b));
}
