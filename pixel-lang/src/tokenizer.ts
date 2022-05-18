import { Rule, Tokenizer } from "tokenizer";
import { KEYWORDS, OPERATORS } from "./grammar.ts";

const tokens = [
  { type: "COMMENT_LINE", pattern: /\/\/.*/, ignore: true },
  { type: "KEYWORD", pattern: [...KEYWORDS] },
  { type: "DIGIT", pattern: /-?[\d.]+(?:e-?\d+)?/ },
  { type: "WORD", pattern: /[a-zA-Z]+/ },
  { type: "OPEN_PARENTHESIS", pattern: "(" },
  { type: "CLOSE_PARENTHESIS", pattern: ")" },
  { type: "OPERATOR", pattern: [...OPERATORS] },
  { type: "SPACE", pattern: /\s/, ignore: true },
] as const;

type TokenType = Exclude<
  `${typeof tokens[number]["type"]}`,
  "SPACE" | "COMMENT_LINE"
>;

export interface TokenLocation {
  line: number;
  column: number;
}

export interface Token {
  type: TokenType;
  value: string;
  location: TokenLocation;
}

/**
 * Convert a source code into Tokens
 * @param source source code to convert
 * @returns the source code tokenized
 */
export function tokenize(source: string): Token[] {
  const tokenizer = new Tokenizer(`${source}\n`, structuredClone(tokens));
  return tokenizer.tokenize().map((token) => ({
    type: token.type as TokenType,
    value: token.value,
    location: findLocation(source, token.position.start),
  }));
}

/**
 * Take a whole text and a position and convert it to a row column notation
 *
 * @param source whole source code
 * @param position position in the source code
 * @returns row, col, file of the given position
 */
function findLocation(source: string, position: number) {
  const previous = source.substring(0, position);
  const lines = previous.split(/\n/);
  const lastLine = lines.at(-1)!;
  return {
    line: lines.length,
    column: lastLine.length + 1,
  };
}
