function generateRandomString() {
  return Math.floor(Math.random() * 36 ** 8)
    .toString(36)
    .padStart(8, "0");
}

export function serialize(value: unknown): string {
  const PLACEHOLDER_ARRAY_BEGIN = `#SERIALIZE_PLACEHOLDER_AB#${generateRandomString()}#`;
  const PLACEHOLDER_ARRAY_END = `#SERIALIZE_PLACEHOLDER_AE#${generateRandomString()}#`;
  const REGEXPS = [
    new RegExp(`\\[\\s*"${PLACEHOLDER_ARRAY_BEGIN}([^#]+)#"\\s*,`, "g"),
    new RegExp(`,\\s*"${PLACEHOLDER_ARRAY_END}([^#]+)#"\\s*\\]`, "g"),
  ];

  const serialized = JSON.stringify(value, (_key, value): unknown =>
    value instanceof Map
      ? [
          `${PLACEHOLDER_ARRAY_BEGIN}new Map([#`,
          ...value.entries(),
          `${PLACEHOLDER_ARRAY_END}])#`,
        ]
      : value instanceof Set
        ? [
            `${PLACEHOLDER_ARRAY_BEGIN}new Set([#`,
            ...value.entries(),
            `${PLACEHOLDER_ARRAY_END}])#`,
          ]
        : value
  );

  const result = REGEXPS.reduce(
    (serialized, regexp) => serialized.replace(regexp, "$1"),
    serialized
  );

  return result;
}
