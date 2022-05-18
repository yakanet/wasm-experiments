import { Tokenizer } from "https://raw.githubusercontent.com/load1n9/tokenizer/master/mod.ts";

export interface TokenLocation {
  line: number;
  column: number;
}
export interface Token {
  type: TokenType;
  value: string;
  location: TokenLocation;
}

type TokenType =
  | "KEYWORD"
  | "TYPE"
  | "WORD"
  | "OPERATOR"
  | "STRING"
  | "DIGIT"
  | "OPEN_PARENTHESIS"
  | "CLOSE_PARENTHESIS";

const KEYWORDS = [
  "echo",
  "while",
  "end",
  "let",
];

export const OPERATORS = [
  "+",
  "-",
  "*",
  "/",
  "<<",
  ">>",
  ">=",
  "<=",
  ">",
  "<",
  "=",
  "&&",
  "||"
];

/**
 * Convert a source code into Tokens
 * @param source source code to convert
 * @returns the source code tokenized
 */
export function tokenize(source: string): Token[] {
  const tokenizer = new Tokenizer(`${source}\n`, [
    { type: "COMMENT_LINE", pattern: /\/\/.*/, ignore: true },
    { type: "KEYWORD", pattern: KEYWORDS },
    { type: "DIGIT", pattern: /-?[\d.]+(?:e-?\d+)?/ },
    { type: "WORD", pattern: /[a-zA-Z]+/ },
    { type: "OPEN_PARENTHESIS", pattern: "(" },
    { type: "CLOSE_PARENTHESIS", pattern: ")" },
    { type: "OPERATOR", pattern: OPERATORS },
    { type: "SPACE", pattern: /\s/, ignore: true },
  ]);
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
