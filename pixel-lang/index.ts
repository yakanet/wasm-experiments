import { compile } from "./compiler.ts";
import { out } from "./util.ts";

function usage() {
  console.log(`Usage : deno run -A .\index.ts <INPUT>`);
  Deno.exit(1);
}

if (Deno.args.length !== 1) {
  usage();
}

const [source_path] = Deno.args;
const source_code = await Deno.readTextFile(source_path);

const { bytecode, text } = compile(source_code, source_path, {
  optimize: false,
});
await Deno.writeTextFile(out`${source_path}.wat`, text);
await Deno.writeFile(out`${source_path}.wasm`, bytecode);
