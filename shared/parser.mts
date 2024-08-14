const SYM_S_OR = Symbol("|"); // or

const SYM_D_Q01 = Symbol("?"); // zero or one
const SYM_D_Q0N = Symbol("*"); // zero or more
const SYM_D_Q1N = Symbol("+"); // one or more
const SYM_D_EQU = Symbol("="); // positive lookahead
const SYM_D_NEG = Symbol("!"); // negative lookahead

export type Terminal =
  | string
  | RegExp
  | ((src: string, startIndex: number) => number);
export type SimpleExpression = Terminal | RuleName;
export type ExpressionDecorator =
  | typeof SYM_D_Q01
  | typeof SYM_D_Q0N
  | typeof SYM_D_Q1N
  | typeof SYM_D_EQU
  | typeof SYM_D_NEG;
export type Expression =
  | SimpleExpression
  | readonly [ExpressionDecorator, ...Expressions[]]
  | readonly [typeof SYM_S_OR, ...Expressions[]];
export type Expressions = Expression | readonly Expression[];
export type RuleToken<T> = readonly [
  name: RuleName,
  tokens: readonly Token<T>[],
];
export type Token<T> = RuleToken<T> | string | T;
export type Processor<T> = (
  tokens: readonly Token<T>[]
) => readonly Token<T>[] | undefined;
export type RuleName = symbol;
export type Rule<T> =
  | readonly [name: RuleName, expressions: Expressions]
  | readonly [
      name: RuleName,
      expressions: Expressions,
      processor: Processor<T>,
    ];
export type Syntax<T> = readonly Rule<T>[];
export type Parser<T> = (input: string) => readonly Token<T>[] | undefined;

type TokensWithLength<T> = readonly [
  tokens: readonly Token<T>[],
  length: number,
];

export function OR(...expressions: readonly Expressions[]): Expression {
  return [SYM_S_OR, ...expressions];
}

export function Q01(...expressions: readonly Expressions[]): Expression {
  return [SYM_D_Q01, ...expressions];
}

export function Q0N(...expressions: readonly Expressions[]): Expression {
  return [SYM_D_Q0N, ...expressions];
}

export function Q1N(...expressions: readonly Expressions[]): Expression {
  return [SYM_D_Q1N, ...expressions];
}

export function EQU(...expressions: readonly Expressions[]): Expression {
  return [SYM_D_EQU, ...expressions];
}

export function NOT(...expressions: readonly Expressions[]): Expression {
  return [SYM_D_NEG, ...expressions];
}

export function isRuleToken<T>(token: Token<T>): token is RuleToken<T> {
  return (
    Array.isArray(token) && token.length === 2 && typeof token[0] === "symbol"
  );
}

export function filterRuleTokens<T>(
  tokens: readonly Token<T>[],
  ruleName: RuleName
): readonly RuleToken<T>[] {
  return tokens.filter(
    (token): token is RuleToken<T> =>
      isRuleToken(token) && token[0] === ruleName
  );
}

export function unwrapTokens<T>(
  tokens: readonly Token<T>[]
): readonly Token<T>[] {
  return tokens.flatMap((token) => (isRuleToken(token) ? token[1] : [token]));
}

export function stringifyTokens(
  tokens: readonly Token<unknown>[],
  depth = -1
): string {
  return tokens
    .map((token) =>
      typeof token === "string"
        ? token
        : isRuleToken(token) && depth !== 0
          ? stringifyTokens(token[1], depth - 1)
          : ""
    )
    .join("");
}

function isDecorator(value: unknown): value is ExpressionDecorator {
  return (
    value === SYM_D_Q01 ||
    value === SYM_D_Q0N ||
    value === SYM_D_Q1N ||
    value === SYM_D_EQU ||
    value === SYM_D_NEG
  );
}

function isExpression(expression: Expressions): expression is Expression {
  return (
    !Array.isArray(expression) ||
    isDecorator(expression[0]) ||
    expression[0] === SYM_S_OR
  );
}

function parseExpression<T>(
  src: string,
  startIndex: number,
  expression: Expression,
  ruleMap: ReadonlyMap<RuleName, Rule<T>>
): TokensWithLength<T> | undefined {
  if (Array.isArray(expression)) {
    const [sym, ...subExpressions] = expression as Exclude<
      Expression,
      SimpleExpression
    >;

    if (sym === SYM_S_OR) {
      for (const subExpression of subExpressions) {
        const result = parseExpressions(
          src,
          startIndex,
          [subExpression],
          ruleMap
        );
        if (result) {
          return result;
        }
      }
      return;
    }

    if (isDecorator(sym)) {
      const tokens: Token<T>[] = [];
      let offset = startIndex;

      const max = sym === SYM_D_Q0N || sym === SYM_D_Q1N ? Infinity : 1;
      let count = 0;
      for (; count < max; count++) {
        const result = parseExpressions(src, offset, subExpressions, ruleMap);
        if (!result) {
          break;
        }
        tokens.push(...result[0]);
        offset += result[1];
      }

      switch (sym) {
        case SYM_D_Q01:
        case SYM_D_Q0N:
          return [tokens, offset - startIndex];

        case SYM_D_Q1N:
          return count ? [tokens, offset - startIndex] : undefined;

        case SYM_D_EQU:
          return count ? [[], 0] : undefined;

        case SYM_D_NEG:
          return count ? undefined : [[], 0];
      }
    }

    throw new Error(`invalid expression: ${String(expression)}`);
  }

  if (typeof expression === "string") {
    return src.startsWith(expression, startIndex)
      ? [[expression], expression.length]
      : undefined;
  }

  if (expression instanceof RegExp) {
    const match = src.slice(startIndex).match(expression);
    return match?.index === 0 ? [[match[0]], match[0].length] : undefined;
  }

  if (typeof expression === "function") {
    const length = expression(src, startIndex);
    if (!isFinite(length)) {
      throw new TypeError("invalid length");
    }
    return length >= 0
      ? [[src.slice(startIndex, startIndex + length)], length]
      : undefined;
  }

  if (typeof expression === "symbol") {
    const subRule = ruleMap.get(expression);
    if (!subRule) {
      throw new Error(`sub rule ${String(expression)} not found`);
    }
    return parseRule(src, startIndex, subRule, ruleMap);
  }

  throw new Error(`invalid expression: ${String(expression)}`);
}

function parseExpressions<T>(
  src: string,
  startIndex: number,
  expressions: readonly Expressions[],
  ruleMap: ReadonlyMap<RuleName, Rule<T>>
): TokensWithLength<T> | undefined {
  const tokens: Token<T>[] = [];
  let offset = startIndex;

  for (const expression of expressions) {
    const result = isExpression(expression)
      ? parseExpression(src, offset, expression, ruleMap)
      : parseExpressions(src, offset, expression, ruleMap);
    if (!result) {
      return;
    }

    tokens.push(...result[0]);
    offset += result[1];
  }

  return [tokens, offset - startIndex];
}

function parseRule<T>(
  src: string,
  startIndex: number,
  rule: Rule<T>,
  ruleMap: ReadonlyMap<RuleName, Rule<T>>
): TokensWithLength<T> | undefined {
  const [name, expressions, processor] = rule;
  const result = parseExpressions(src, startIndex, [expressions], ruleMap);
  if (!result) {
    return;
  }
  const [tokens, length] = result;
  return [[[name, processor?.(tokens) ?? tokens]], length];
}

export function createParser<T = never>(
  syntax: Syntax<T>,
  start?: RuleName
): Parser<T> {
  const ruleMap: ReadonlyMap<RuleName, Rule<T>> = new Map(
    syntax.map((e) => [e[0], e])
  );

  const startRule = ruleMap.get(start ?? syntax[0][0]);
  if (!startRule) {
    throw new Error("start rule not found");
  }

  for (const element of syntax.flat()) {
    if (
      typeof element !== "symbol" ||
      isDecorator(element) ||
      element === SYM_S_OR ||
      ruleMap.has(element)
    ) {
      continue;
    }
    throw new Error(`rule ${String(element)} not found`);
  }

  return (input: string): readonly Token<T>[] | undefined => {
    const result = parseRule(input, 0, startRule, ruleMap);
    if (!result) {
      return;
    }
    const [tokens, length] = result;
    if (length !== input.length) {
      // incomplete
      return;
    }
    return (tokens[0] as RuleToken<T>)[1];
  };
}
