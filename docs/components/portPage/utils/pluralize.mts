/**
 * @example
 * ```ts
 * pluralize(1, 'commit'); // => 'one commit'
 * pluralize(2, 'commit'); // => '2 commits'
 * pluralize(0, 'more commit'); // => 'no more commits'
 * pluralize(3, 'transitive dependency'); // => '3 transitive dependencies'
 * ```
 */
export function pluralize(
  count: number,
  text: `${string}${'commit' | 'dependency' | 'dependent' | 'item' | 'port'}`,
  capitalize = false
): string {
  return `${(capitalize ? ['No', 'One'] : ['no', 'one'])[count] || count} ${
    count === 1 ? text : text.replace(/y$/, 'ies').replace(/[^s]$/, '$&s')
  }`;
}
