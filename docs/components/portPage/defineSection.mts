import type { MarkdownHeading } from 'astro';
import type { PortContext } from '../../../shared/dataTypes/portContext.mjs';
import { slugify } from '../../constants.mjs';

export interface SectionProps {
  readonly context: PortContext;
  readonly section: ResolvedSection;
}

export interface SectionDefinition {
  readonly title: string;
  readonly noHeading?: boolean | undefined;
  readonly exists?: boolean | undefined;
  readonly headings?: readonly MarkdownHeading[] | undefined;
  readonly level?: number;
}

export interface ResolvedSection extends Required<SectionDefinition> {
  readonly headings: readonly MarkdownHeading[];
  readonly slug: string;
}

export type SectionSubset = Pick<
  ResolvedSection,
  'title' | 'slug' | 'level' | 'noHeading'
>;

export function defineSection(
  definition:
    | SectionDefinition
    | ((context: PortContext) => SectionDefinition | null | undefined)
): (context: PortContext) => ResolvedSection | undefined {
  return (context) => {
    const def =
      typeof definition === 'function' ? definition(context) : definition;
    if (!def) {
      return;
    }
    const level = def.level || 2;
    const slug = slugify(def.title);
    return {
      ...def,
      level,
      slug,
      headings: [
        ...(def.noHeading
          ? []
          : [
              {
                depth: level,
                slug,
                text: def.title,
              },
            ]),
        ...(def.headings || []),
      ],
      noHeading: def.noHeading ?? false,
      exists: def.exists ?? true,
    };
  };
}
