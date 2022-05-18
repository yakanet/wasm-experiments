import { tokenize } from "./tokenizer.ts";
import { write } from "./bytecode.ts";
import { parse } from "./parser.ts";
import { wrapWithMain } from "./transformer.ts";
import { json, out } from "./util.ts";

export function compile(
  source: string,
  source_path: string,
  option: { optimize: boolean } = { optimize: false },
) {
  // 1. String => Token[]
  const tokens = tokenize(source);
  Deno.writeTextFile(out`${source_path}_token.json`, json(tokens));

  // 2. Token[] => Statement[]
  let ast = parse(tokens);
  Deno.writeTextFile(out`${source_path}_ast.json`, json(ast));

  // 3. Statement[] => Function[]
  ast = wrapWithMain(ast);
  Deno.writeTextFile(out`${source_path}_ast_fixed.json`, json(ast));

  // 3. Function[] => {WAT, WASM}
  return write(ast, option.optimize);
}
