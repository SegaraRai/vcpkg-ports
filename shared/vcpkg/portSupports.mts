import jsep from 'jsep';
import {
  FULL_TRIPLETS,
  FullSupportTriplet,
  MinifiedTriplet,
  minifyTriplets,
} from './triplets.mjs';

// https://learn.microsoft.com/vcpkg/reference/vcpkg-json#platform-expression
export const VCPKG_SUPPORTS_VALID_IDENTIFIERS = [
  // platform
  'android',
  'emscripten',
  'freebsd',
  'ios',
  'linux',
  'mingw',
  'openbsd',
  'osx',
  'uwp',
  'windows',
  'xbox', // not documented but used (community?)
  // arch
  'x64',
  'x86',
  'arm',
  'arm32', // not documented but used (community?)
  'arm64',
  'wasm32',
  // linkage
  'static',
  // etc.
  'staticcrt',
  'native',
] as const;

export const VCPKG_SUPPORTS_VALID_IDENTIFIER_SET: ReadonlySet<string> = new Set(
  VCPKG_SUPPORTS_VALID_IDENTIFIERS
);

export function evalVcpkgSupportsExpr(
  expr: jsep.Expression,
  truthyValues: readonly string[]
): boolean {
  const cExpr = expr as
    | jsep.CoreExpression
    | { type: 'SequenceExpression'; expressions: jsep.Expression[] };

  switch (cExpr.type) {
    case 'Identifier':
      if (!VCPKG_SUPPORTS_VALID_IDENTIFIER_SET.has(cExpr.name)) {
        throw new Error(`Invalid identifier: ${cExpr.name}`);
      }
      return truthyValues.includes(cExpr.name);

    case 'UnaryExpression':
      switch (cExpr.operator) {
        case '!':
          return !evalVcpkgSupportsExpr(cExpr.argument, truthyValues);

        default:
          throw new Error(`Unknown unary operator: ${cExpr.operator}`);
      }

    case 'BinaryExpression':
      switch (cExpr.operator) {
        case '|':
          return (
            evalVcpkgSupportsExpr(cExpr.left, truthyValues) ||
            evalVcpkgSupportsExpr(cExpr.right, truthyValues)
          );

        case '&':
          return (
            evalVcpkgSupportsExpr(cExpr.left, truthyValues) &&
            evalVcpkgSupportsExpr(cExpr.right, truthyValues)
          );

        default:
          throw new Error(`Unknown binary operator: ${cExpr.operator}`);
      }

    case 'SequenceExpression':
      // same as | operator
      return cExpr.expressions.some((e) =>
        evalVcpkgSupportsExpr(e, truthyValues)
      );

    case 'Compound':
      // same as | operator
      return cExpr.body.some((e) => evalVcpkgSupportsExpr(e, truthyValues));

    default:
      throw new Error(`Unknown expression type: ${cExpr.type}`);
  }
}

export function parseVcpkgSupports(supports: string): jsep.Expression {
  return jsep(supports);
}

export function getSupports(
  supports: string,
  allTriplets = FULL_TRIPLETS,
  allTripletsForMinify = FULL_TRIPLETS
): {
  supported: readonly FullSupportTriplet[];
  unsupported: readonly FullSupportTriplet[];
  supportedMinified: readonly MinifiedTriplet[];
  unsupportedMinified: readonly MinifiedTriplet[];
} {
  const getValuesFromTriplet = (triplet: string): string[] => {
    const values = triplet.split('-');
    values.push('native');
    if (values.includes('arm64')) {
      values.push('arm');
    }
    return values;
  };
  const triplets = allTriplets.map(
    (t) =>
      [
        t,
        evalVcpkgSupportsExpr(jsep(supports), getValuesFromTriplet(t)),
      ] as const
  );

  const supportedTriplets = triplets.filter((t) => t[1]).map((t) => t[0]);
  const unsupportedTriplets = triplets.filter((t) => !t[1]).map((t) => t[0]);

  return {
    supported: supportedTriplets,
    unsupported: unsupportedTriplets,
    supportedMinified: minifyTriplets(supportedTriplets, allTripletsForMinify),
    unsupportedMinified: minifyTriplets(
      unsupportedTriplets,
      allTripletsForMinify
    ),
  };
}
