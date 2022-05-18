import type { AST, ProcStatement } from "./parser.ts";
export function wrapWithMain(ast: AST): AST {
  // do we have a main proc?
  if (!ast.find((a) => a.type === "procStatement" && a.name === "main")) {
    // if not - collect up any 'free' statements and add one.
    const freeStatements = ast.filter((a) =>
      a.type !== "procStatement"
    ) as any[];
    const mainProc: ProcStatement = {
      type: "procStatement",
      name: "main",
      args: [],
      export: true,
      statements: freeStatements,
      location: freeStatements[0].location,
    };
    ast = [mainProc, ...ast.filter((a) => a.type === "procStatement")];
  }

  return ast;
}
