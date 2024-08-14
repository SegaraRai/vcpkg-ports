// syntax: `${FOO}` and `# ${#FOO}`

export function replaceTemplates(
  src: string,
  replacements: Readonly<Partial<Record<string, string>>>
): string {
  return src.replace(
    /#\s*\${#([^}]+)}|\$\{([^#][^}]*)\}/g,
    (_, p1: string, p2: string) => {
      const key = p1 || p2;
      const replacement = replacements[key];
      if (replacement == null) {
        throw new Error(`No replacement for ${key}`);
      }
      return replacement;
    }
  );
}
