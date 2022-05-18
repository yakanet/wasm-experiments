export const KEYWORDS = [
  "echo",
  "while",
  "end",
  "let",
] as const;

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
  "||",
] as const;

export type Operator = typeof OPERATORS[number];
export type Keyword = typeof KEYWORDS[number];
