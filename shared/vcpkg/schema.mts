// Run `pnpm run validate:manifests` to check if ports under .vcpkg are schema compliant

import { z } from "zod";
import { evalVcpkgSupportsExpr, parseVcpkgSupports } from "./portSupports.mjs";

type DeepReadonly<T> = T extends (infer U)[]
  ? readonly DeepReadonly<U>[]
  : T extends object
    ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
    : T;

export const zVcpkgPortName = z
  .string()
  .min(1)
  .regex(/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/);
export const zVcpkgFeatureName = z
  .string()
  .min(1)
  .regex(/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/);
export const zVcpkgURL = z
  .string()
  .min(1)
  .transform((v) => (/^[^.:/]+\./.test(v) ? `https://${v}` : v))
  .refine((v) => /^https?:\/\//.test(v), {
    message: "URL must start with http:// or https://",
  });
// NOTE: empty string and empty array are allowed
export const zVcpkgDescription = z.union([z.string(), z.array(z.string())]);
export type VcpkgDescription = DeepReadonly<z.infer<typeof zVcpkgDescription>>;
export const zVcpkgSupports = z
  .string()
  .min(1)
  .regex(/^[a-z\d!&|(), ]+$/)
  .refine(
    (v: string): boolean => {
      try {
        return (
          typeof evalVcpkgSupportsExpr(parseVcpkgSupports(v), []) === "boolean"
        );
      } catch {
        return false;
      }
    },
    (v: string) => {
      return {
        message: `Invalid vcpkg supports expression (${v})`,
      };
    }
  );
export const zVcpkgLicense = z.string().min(1);

export const zVcpkgFeatureItem = z.union([
  zVcpkgFeatureName,
  z.object({ name: zVcpkgFeatureName, platform: zVcpkgSupports }),
]);
export type VcpkgFeatureItem = DeepReadonly<z.infer<typeof zVcpkgFeatureItem>>;

export const zVcpkgDependencyObject = z
  .object({
    name: zVcpkgPortName,
    host: z.boolean().optional(),
    "default-features": z.boolean().optional(),
    features: z.array(zVcpkgFeatureItem).optional(),
    platform: zVcpkgSupports.optional(),
    "version>=": z.string().min(1).optional(),
  })
  .strict();
export type VcpkgDependencyObject = DeepReadonly<
  z.infer<typeof zVcpkgDependencyObject>
>;

export const zVcpkgDependency = z.union([
  zVcpkgPortName,
  zVcpkgDependencyObject,
]);
export type VcpkgDependency = DeepReadonly<z.infer<typeof zVcpkgDependency>>;

export const zVcpkgFeature = z
  .object({
    description: zVcpkgDescription,
    dependencies: z.array(zVcpkgDependency).optional(),
    supports: zVcpkgSupports.optional(),
    license: zVcpkgLicense.nullable().optional(),
  })
  .strict();
export type VcpkgFeature = DeepReadonly<z.infer<typeof zVcpkgFeature>>;

// vcpkg.json without versioning fields
// https://learn.microsoft.com/vcpkg/reference/vcpkg-json
const zVcpkgBase = z.object({
  name: zVcpkgPortName,
  "port-version": z.number().int().min(0).optional(),
  maintainers: z
    .union([z.string().min(1), z.array(z.string().min(1))])
    .optional(),
  description: zVcpkgDescription.optional(),
  homepage: zVcpkgURL.optional(),
  documentation: zVcpkgURL.optional(),
  license: zVcpkgLicense.nullable().optional(),
  supports: zVcpkgSupports.optional(),
  dependencies: z.array(zVcpkgDependency).optional(),
  "default-features": z.array(zVcpkgFeatureItem).optional(),
  features: z.record(zVcpkgFeatureName, zVcpkgFeature).optional(),
  // non-standard fields
  summary: z.string().optional(),
});

// https://learn.microsoft.com/vcpkg/reference/vcpkg-json#version
// https://learn.microsoft.com/vcpkg/users/versioning#version-schemes
export const zVcpkg = z.union([
  // NOTE: though correct syntax for `version` is `/^(0|[1-9]\d*)(\.(0|[1-9]\d*))*$/`, some old ports do not comply with this.
  // so we use same regex as version-string.
  zVcpkgBase
    .extend({
      version: z
        .string()
        .min(1)
        // NOTE: though version-string allows any string, we check if it does not contain dangerous characters
        .regex(/^[\w.+-]+$/),
    })
    .strict(),
  zVcpkgBase
    .extend({
      "version-semver": z
        .string()
        .min(1)
        .regex(
          /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/
        ),
    })
    .strict(),
  zVcpkgBase
    .extend({
      "version-date": z
        .string()
        .min(1)
        .regex(/^\d{4}-\d{2}-\d{2}(\.(0|[1-9]\d*))*$/),
    })
    .strict(),
  zVcpkgBase
    .extend({
      "version-string": z
        .string()
        .min(1)
        // NOTE: though version-string allows any string, we check if it does not contain dangerous characters
        .regex(/^[\w.+-]+$/),
    })
    .strict(),
]);
export type Vcpkg = DeepReadonly<z.infer<typeof zVcpkg>>;

export function parseVcpkgJSON(json: string): Vcpkg {
  return zVcpkg.parse(
    JSON.parse(json, (key, value): unknown =>
      key.startsWith("$") ? undefined : value
    )
  );
}
