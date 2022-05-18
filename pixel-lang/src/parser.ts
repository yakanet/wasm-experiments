import type { Token, TokenLocation } from "./tokenizer.ts";
import type { Operator } from "./grammar.ts";
import { json } from "./util.ts";

export interface PrintStatement {
  type: "printStatement";
  expression: Expression;
  location: TokenLocation;
}

export interface ProcStatement {
  type: "procStatement";
  name: string;
  args: Identifier[];
  statements: Statement[];
  location: TokenLocation;
  export: boolean;
}

export interface VariableDeclarationAssignmentStatement {
  type: "variableDeclarationAssignment";
  name: string;
  value: Expression;
  location: TokenLocation;
}

export interface VariableAssignmentStatement {
  type: "variableAssignment";
  name: string;
  value: Expression;
  location: TokenLocation;
}

export interface WhileStatement {
  type: "whileStatement";
  condition: Expression;
  statements: Statement[];
  location: TokenLocation;
}

export interface NumberLiteral {
  type: "numberLiteral";
  value: number;
  location: TokenLocation;
}

interface BinaryExpression {
  type: "binaryExpression";
  value: Operator;
  left: Expression;
  right: Expression;
  location: TokenLocation;
}

export interface Identifier {
  type: "identifier";
  value: string;
  location: TokenLocation;
}

export interface SubExpression {
  type: "subExpression";
  expression: Expression;
  location: TokenLocation;
}

export type Statement =
  | PrintStatement
  | ProcStatement
  | VariableAssignmentStatement
  | VariableDeclarationAssignmentStatement
  | WhileStatement;
export type Expression =
  | NumberLiteral
  | Identifier
  | BinaryExpression
  | SubExpression;
export type AST = Statement[];

function parseOperator(t: TokenIterator, left: Expression): Expression {
  const operator = t.currentToken();
  t.markAsDone();
  const right = parseExpression(t);
  return {
    type: "binaryExpression",
    left,
    value: <Operator> operator.value,
    right,
    location: operator.location,
  };
}

function parseVariableAssignment(t: TokenIterator): Statement {
  const identifier = t.currentToken();
  t.markAsDone();
  t.markAsDone(); // =
  return {
    type: "variableAssignment",
    name: identifier.value,
    value: parseExpression(t),
    location: identifier.location,
  };
}

function parseExpression(t: TokenIterator): Expression {
  switch (t.currentToken().type) {
    case "DIGIT": {
      const numberLiteral: NumberLiteral = {
        type: "numberLiteral",
        value: Number(t.currentToken().value),
        location: t.currentToken().location,
      };
      t.markAsDone();
      if (t.currentToken()?.type === "OPERATOR") {
        return parseOperator(t, numberLiteral);
      }
      return numberLiteral;
    }
    case "WORD":
      const identifier: Identifier = {
        type: "identifier",
        location: t.currentToken().location,
        value: t.currentToken().value,
      };
      t.markAsDone();
      if (t.currentToken()?.type === "OPERATOR") {
        return parseOperator(t, identifier);
      }
      return identifier;

    case "OPEN_PARENTHESIS": {
      const { location } = t.currentToken();
      t.markAsDone();

      const expression = parseExpression(t);
      if (t.currentToken().type !== "CLOSE_PARENTHESIS") {
        throw new Error("Unclosed parenthesis on " + json(t.currentToken()));
      }
      t.markAsDone(); // )
      const parenthesis: SubExpression = {
        type: "subExpression",
        expression,
        location,
      };
      if (t.currentToken()?.type === "OPERATOR") {
        return parseOperator(t, parenthesis);
      }
      return parenthesis;
    }
    default:
      throw new Error(
        "Unrecognized expression: " + json(t.currentToken()),
      );
  }
}

function statementEcho(t: TokenIterator): Statement {
  const token = t.currentToken();
  t.markAsDone();
  return {
    type: "printStatement",
    expression: parseExpression(t),
    location: token.location,
  };
}

function statementWhile(t: TokenIterator): Statement {
  const whileToken = t.currentToken();
  t.markAsDone();
  if (t.currentToken().type !== "OPEN_PARENTHESIS") {
    throw new Error(
      "A while instruction should be followed by an open parenthesis. " +
        json(t.currentToken()),
    );
  }
  t.markAsDone(); // ()
  const condition = parseExpression(t);

  if (t.currentToken().type !== "CLOSE_PARENTHESIS") {
    throw new Error(
      "A while instruction should end with a close parenthesis. " +
        json(t.currentToken()),
    );
  }
  t.markAsDone(); // )

  const statements: Statement[] = [];
  while (
    t.currentToken().type !== "KEYWORD" || t.currentToken().value !== "end"
  ) {
    statements.push(parseStatement(t));
  }
  t.markAsDone(); // end

  return {
    type: "whileStatement",
    condition,
    statements,
    location: whileToken.location,
  };
}

function statementVariableDeclaration(t: TokenIterator): Statement {
  t.markAsDone();
  const identifier = t.currentToken();
  t.markAsDone();
  if (t.currentToken().value !== "=") {
    throw new Error(
      "A variable must be initialized " + json(identifier.location),
    );
  }
  t.markAsDone();
  return {
    type: "variableDeclarationAssignment",
    name: identifier.value,
    value: parseExpression(t),
    location: identifier.location,
  };
}

function parseStatement(t: TokenIterator): Statement {
  if (t.currentToken().type === "KEYWORD") {
    switch (t.currentToken().value) {
      case "echo":
        return statementEcho(t);
      case "let":
        return statementVariableDeclaration(t);
      case "while":
        return statementWhile(t);
      default:
        throw new Error(
          "Unrecognized statement: " +
            json(t.currentToken()),
        );
    }
  } else if (t.currentToken().type === "WORD") {
    if (t.peekNextToken()?.value === "=") {
      return parseVariableAssignment(t);
    }
  }
  throw new Error("Unrecognized token: " + json(t.currentToken()));
}

export function parse(tokens: Token[]): AST {
  let t = new TokenIterator(tokens);
  const nodes: AST = [];
  while (t.currentToken()) {
    nodes.push(parseStatement(t));
  }
  return nodes;
}

class TokenIterator {
  private index = -1;
  private _currentToken: Token;

  constructor(private tokens: Token[]) {
    this._currentToken = this.markAsDone();
  }

  currentToken() {
    return this._currentToken;
  }

  peekNextToken() {
    return this.tokens[this.index + 1];
  }

  markAsDone() {
    this._currentToken = this.tokens[++this.index];
    return this._currentToken;
  }
}
