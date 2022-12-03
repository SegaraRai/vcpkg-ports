import { compareString } from '../utils.mjs';
import type {
  Vcpkg,
  VcpkgDependency,
  VcpkgDependencyObject,
  VcpkgDescription,
} from './schema.mjs';

export function isHostOnlyPort(manifest: Vcpkg): boolean {
  return !!manifest.supports?.includes('native');
}

export function getPortVersionText(manifest: Vcpkg): string {
  return (
    (manifest as any).version ||
    (manifest as any)['version-semver'] ||
    (manifest as any)['version-date'] ||
    (manifest as any)['version-string'] ||
    '(unknown)'
  );
}

export function stringifyPortDescription(
  description: VcpkgDescription | null | undefined
): string {
  if (!description) {
    return '';
  }
  if (typeof description === 'string') {
    description = [description];
  }
  let result = '';
  for (const [index, chunk] of description.entries()) {
    const normalized = chunk.normalize().trim();
    const joiner = !result
      ? ''
      : index > 1 && !result.endsWith('.') && /^[a-z]/.test(normalized)
      ? ' '
      : '\n';
    result += joiner + normalized;
  }
  return result;
}

export function getShortPortDescription(
  description: VcpkgDescription | null | undefined
): string {
  return stringifyPortDescription(description)
    .split(/\n|\.(?:\s|$)/)[0]
    .trim()
    .replace(/\.+$/, '');
}

export function transformPortDependencyToObject(
  dependency: VcpkgDependency
): VcpkgDependencyObject {
  return typeof dependency === 'string' ? { name: dependency } : dependency;
}

export function getDependencies(
  manifest: Pick<Vcpkg, 'dependencies'>
): readonly VcpkgDependencyObject[] {
  return (manifest.dependencies || [])
    .map(transformPortDependencyToObject)
    .sort((a, b) => compareString(a.name, b.name));
}

export function isNormalDependency(dependency: VcpkgDependencyObject): boolean {
  return !dependency.host;
}

export function isHostDependency(dependency: VcpkgDependencyObject): boolean {
  return !!dependency.host;
}
