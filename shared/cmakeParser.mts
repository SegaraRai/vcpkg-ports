import {
  EQU,
  NOT,
  OR,
  Q01,
  Q0N,
  Q1N,
  type Token,
  createParser,
  filterRuleTokens,
  stringifyTokens,
  unwrapTokens,
} from "./parser.mjs";

// https://cmake.org/cmake/help/v3.25/manual/cmake-language.7.html

export const NT_FILE = Symbol("file");
export const NT_FILE_ELEMENT = Symbol("file_element");
export const NT_LINE_ENDING = Symbol("line_ending");
export const NT_SPACE = Symbol("space");
export const NT_NEWLINE = Symbol("newline");
export const NT_COMMAND_INVOCATION = Symbol("command_invocation");
export const NT_IDENTIFIER = Symbol("identifier");
export const NT_ARGUMENTS = Symbol("arguments");
export const NT_SEPARATED_ARGUMENTS = Symbol("separated_arguments");
export const NT_SEPARATION = Symbol("separation");
export const NT_ARGUMENT = Symbol("argument");
export const NT_BRACKET_ARGUMENT = Symbol("bracket_argument");
export const NT_BRACKET_OPEN = Symbol("bracket_open");
export const NT_BRACKET_CONTENT = Symbol("bracket_content");
export const NT_BRACKET_CLOSE = Symbol("bracket_close");
export const NT_QUOTED_ARGUMENT = Symbol("quoted_argument");
export const NT_QUOTED_ELEMENT = Symbol("quoted_element");
export const NT_QUOTED_CONTINUATION = Symbol("quoted_continuation");
export const NT_UNQUOTED_ARGUMENT = Symbol("unquoted_argument");
export const NT_UNQUOTED_ELEMENT = Symbol("unquoted_element");
export const NT_UNQUOTED_LEGACY = Symbol("unquoted_legacy");
export const NT_ESCAPE_SEQUENCE = Symbol("escape_sequence");
export const NT_ESCAPE_IDENTITY = Symbol("escape_identity");
export const NT_ESCAPE_ENCODED = Symbol("escape_encoded");
export const NT_ESCAPE_SEMICOLON = Symbol("escape_semicolon");
export const NT_BRACKET_COMMENT = Symbol("bracket_comment");
export const NT_LINE_COMMENT = Symbol("line_comment");
export const NT_BOM = Symbol("bom");

interface TokenTypeIdentifier {
  readonly type: "identifier";
  readonly value: string;
}
interface TokenTypeArgument {
  readonly type: "argument";
  readonly value: string;
}
interface TokenTypeCommand {
  readonly type: "command";
  readonly name: TokenTypeIdentifier;
  readonly arguments: readonly TokenTypeArgument[];
}
type TokenType = TokenTypeIdentifier | TokenTypeArgument | TokenTypeCommand;
type Tokens = readonly Token<TokenType>[];

const parse = createParser<TokenType>([
  // Source Files
  // https://cmake.org/cmake/help/latest/manual/cmake-language.7.html#source-files
  [NT_FILE, [Q0N(NT_BOM), Q0N(NT_FILE_ELEMENT)], unwrapTokens],
  [
    NT_FILE_ELEMENT,
    OR(
      [NT_COMMAND_INVOCATION, NT_LINE_ENDING],
      [Q0N(OR(NT_BRACKET_COMMENT, NT_SPACE)), NT_LINE_ENDING]
    ),
    (tokens: Tokens): TokenTypeCommand[] =>
      filterRuleTokens(tokens, NT_COMMAND_INVOCATION).flatMap(
        (e) => e[1] as TokenTypeCommand[]
      ),
  ],
  [NT_LINE_ENDING, [Q01(NT_LINE_COMMENT), NT_NEWLINE], () => []],
  [NT_SPACE, /^[\t ]+/, () => []],
  [NT_NEWLINE, /^\n/, () => []],
  // Command Invocations
  // https://cmake.org/cmake/help/latest/manual/cmake-language.7.html#command-invocations
  [
    NT_COMMAND_INVOCATION,
    [
      Q0N(NT_SPACE),
      NT_IDENTIFIER,
      Q0N(NT_SPACE),
      "(",
      NT_ARGUMENTS,
      ")",
      Q0N(NT_SPACE), // this last space is not written in the spec, but required to allow for trailing comments
    ],
    (tokens: Tokens): [TokenTypeCommand] => {
      const identifier = filterRuleTokens(tokens, NT_IDENTIFIER)[0];
      const args = filterRuleTokens(tokens, NT_ARGUMENTS)[0];
      return [
        {
          type: "command",
          name: identifier[1][0] as TokenTypeIdentifier,
          arguments: args[1] as readonly TokenTypeArgument[],
        },
      ];
    },
  ],
  [
    NT_IDENTIFIER,
    /^[A-Za-z_]\w*/,
    (tokens: Tokens): [TokenTypeIdentifier] => [
      {
        type: "identifier",
        value: tokens[0] as string,
      },
    ],
  ],
  [
    NT_ARGUMENTS,
    [Q01(NT_ARGUMENT), Q0N(NT_SEPARATED_ARGUMENTS)],
    (tokens: Tokens): readonly TokenTypeArgument[] =>
      [
        ...filterRuleTokens(tokens, NT_ARGUMENT),
        ...filterRuleTokens(tokens, NT_SEPARATED_ARGUMENTS),
      ].flatMap((e) => e[1] as TokenTypeArgument[]),
  ],
  [
    NT_SEPARATED_ARGUMENTS,
    OR(
      [Q1N(NT_SEPARATION), Q01(NT_ARGUMENT)],
      [NT_ARGUMENT],
      [Q0N(NT_SEPARATION), "(", NT_ARGUMENTS, ")"]
    ),
    (tokens: Tokens): readonly TokenTypeArgument[] =>
      [
        ...filterRuleTokens(tokens, NT_ARGUMENT),
        ...filterRuleTokens(tokens, NT_ARGUMENTS),
      ].flatMap((e) => e[1] as TokenTypeArgument[]),
  ],
  [NT_SEPARATION, OR(NT_BRACKET_COMMENT, NT_SPACE, NT_LINE_ENDING)], // The official site syntax does not include `bracket_comment`, but it is actually needed to support bracket comments in arguments.
  // Command Arguments
  // https://cmake.org/cmake/help/latest/manual/cmake-language.7.html#command-arguments
  [
    NT_ARGUMENT,
    OR(NT_BRACKET_ARGUMENT, NT_QUOTED_ARGUMENT, NT_UNQUOTED_ARGUMENT),
    (tokens: Tokens): readonly [TokenTypeArgument] => [
      { type: "argument", value: stringifyTokens(tokens) },
    ],
  ],
  // Bracket Argument
  // https://cmake.org/cmake/help/latest/manual/cmake-language.7.html#bracket-argument
  [
    NT_BRACKET_ARGUMENT,
    [NT_BRACKET_OPEN, NT_BRACKET_CONTENT, NT_BRACKET_CLOSE],
  ],
  [NT_BRACKET_OPEN, /^\[=*\[/, () => []],
  [
    NT_BRACKET_CONTENT,
    (src: string, index: number): number => {
      if (src[index - 1] !== "[") {
        throw new Error("Unexpected bracket content");
      }
      let numEquals = 0;
      while (src[index - 2 - numEquals] === "=") {
        numEquals++;
      }
      if (src[index - 2 - numEquals] !== "[") {
        throw new Error("Malformed bracket begin");
      }
      const end = src.indexOf(`]${"=".repeat(numEquals)}]`, index);
      if (end === -1) {
        return -1;
      }
      return end - index;
    },
  ],
  [NT_BRACKET_CLOSE, /^\]=*\]/, () => []],
  // Quoted Argument
  // https://cmake.org/cmake/help/latest/manual/cmake-language.7.html#quoted-argument
  [
    NT_QUOTED_ARGUMENT,
    ['"', Q0N(NT_QUOTED_ELEMENT), '"'],
    (tokens: Tokens): Tokens => [stringifyTokens(tokens.slice(1, -1))],
  ],
  [
    NT_QUOTED_ELEMENT,
    OR(/^[^\\"]/, NT_ESCAPE_SEQUENCE, NT_QUOTED_CONTINUATION),
  ],
  [NT_QUOTED_CONTINUATION, ["\\", NT_NEWLINE], () => []],
  // Unquoted Argument
  // https://cmake.org/cmake/help/latest/manual/cmake-language.7.html#unquoted-argument
  [
    NT_UNQUOTED_ARGUMENT,
    OR(
      [
        Q1N(NT_UNQUOTED_ELEMENT),
        // prevent incomplete matching against legacy strings
        EQU(/^[#() \t\n]/),
      ],
      NT_UNQUOTED_LEGACY
    ),
    (tokens: Tokens): Tokens => [stringifyTokens(tokens)],
  ],
  [NT_UNQUOTED_ELEMENT, OR(/^[^()#"\\ \t\n]/, NT_ESCAPE_SEQUENCE)],
  [
    NT_UNQUOTED_LEGACY,
    (src: string, startIndex: number): number => {
      // must not begin with a quote
      if (src[startIndex] === '"') {
        return -1;
      }

      let open = false;
      let offset = startIndex;
      while (offset < src.length) {
        const char = src[offset++];

        switch (char) {
          case '"':
            open = !open;
            continue;

          case "\\":
            offset++;
            continue;
        }

        // we think newlines are not allowed even inside quotes
        // > possibly enclosing *horizontal* whitespace
        const validCharRE = open ? /^[^\n]/ : /^[^()# \t\n]/;
        if (!validCharRE.test(char)) {
          // quotes must be balanced
          if (open) {
            return -1;
          }
          offset--;
          break;
        }
      }

      // empty string is not allowed
      if (offset === startIndex) {
        return -1;
      }

      return offset - startIndex;
    },
  ],
  // Escape Sequences
  // https://cmake.org/cmake/help/latest/manual/cmake-language.7.html#escape-sequences
  [
    NT_ESCAPE_SEQUENCE,
    OR(NT_ESCAPE_IDENTITY, NT_ESCAPE_ENCODED, NT_ESCAPE_SEMICOLON),
    (tokens: Tokens): Tokens => [stringifyTokens(tokens)],
  ],
  [
    NT_ESCAPE_IDENTITY,
    /^\\[^A-Za-z0-9;]/,
    (tokens: Tokens): Tokens => [stringifyTokens(tokens).slice(1)],
  ],
  [
    NT_ESCAPE_ENCODED,
    /^\\[trn]/,
    (tokens: Tokens): Tokens => [
      { t: "\t", r: "\r", n: "\n" }[stringifyTokens(tokens).slice(1)] ?? "",
    ],
  ],
  [NT_ESCAPE_SEMICOLON, /^\\;/, (): Tokens => [";"]],
  // Comments
  // https://cmake.org/cmake/help/latest/manual/cmake-language.7.html#comments
  [NT_BRACKET_COMMENT, ["#", NT_BRACKET_ARGUMENT], () => []],
  [NT_LINE_COMMENT, ["#", NOT(NT_BRACKET_ARGUMENT), /^[^\n]*/], () => []],
  //
  [NT_BOM, "\uFEFF", () => []],
]);

export interface CMakeCommand {
  readonly cmd: string;
  readonly args: readonly string[];
}

export function parseCMake(input: string): readonly CMakeCommand[] | undefined {
  return (
    parse(input.replaceAll("\r\n", "\n").replaceAll("\r", "\n") + "\n") as
      | readonly TokenTypeCommand[]
      | undefined
  )?.map(
    (e): CMakeCommand => ({
      cmd: e.name.value,
      args: e.arguments.map((e) => e.value),
    })
  );
}
