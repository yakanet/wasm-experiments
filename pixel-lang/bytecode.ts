import type {
  AST,
  Expression,
  PrintStatement,
  ProcStatement,
  Statement,
  VariableAssignmentStatement,
  VariableDeclarationAssignmentStatement,
  WhileStatement,
} from "./parser.ts";
import { getVariableDeclaration } from "./util.ts";

import binaryen from "https://unpkg.com/binaryen@108.0.0/index.js";

const isWasi = false;
type Module = typeof binaryen.Module;
const { none, f32, i32 } = binaryen;

const symbols = new Map<string, number>();
let loopCount = 0;

const localIndexForSymbol = (name: string, create = true) => {
  if (!symbols.has(name)) {
    if (create) symbols.set(name, symbols.size);
    else throw new Error("Unknown identifier " + name);
  }
  return symbols.get(name);
};

function writeExpression(module: Module, node: Expression): number {
  switch (node.type) {
    case "numberLiteral": {
      /** https://webassembly.github.io/spec/core/syntax/instructions.html#syntax-instr-numeric */
      return module.f32.const(node.value);
    }
    case "binaryExpression": {
      /** https://webassembly.github.io/spec/core/syntax/instructions.html#syntax-instr-numeric */
      if (node.value === "+") {
        return module.f32.add(
          writeExpression(module, node.left),
          writeExpression(module, node.right),
        );
      }
      if (node.value === "-") {
        return module.f32.sub(
          writeExpression(module, node.left),
          writeExpression(module, node.right),
        );
      }
      if (node.value === "*") {
        return module.f32.mul(
          writeExpression(module, node.left),
          writeExpression(module, node.right),
        );
      }
      if (node.value === "/") {
        return module.f32.div(
          writeExpression(module, node.left),
          writeExpression(module, node.right),
        );
      }
      if (node.value === ">") {
        return module.f32.gt(
          writeExpression(module, node.left),
          writeExpression(module, node.right),
        );
      }
      if (node.value === ">=") {
        return module.f32.ge(
          writeExpression(module, node.left),
          writeExpression(module, node.right),
        );
      }
      if (node.value === "<") {
        return module.f32.lt(
          writeExpression(module, node.left),
          writeExpression(module, node.right),
        );
      }
      if (node.value === "<=") {
        return module.f32.le(
          writeExpression(module, node.left),
          writeExpression(module, node.right),
        );
      }
      if (node.value === "&&") {
        return module.i32.and(
          writeExpression(module, node.left),
          writeExpression(module, node.right),
        );
      }
      if (node.value === "||") {
        return module.i32.or(
          writeExpression(module, node.left),
          writeExpression(module, node.right),
        );
      }
      throw new Error("Unknown binary operation " + node.value);
    }
    case "identifier": {
      /** https://webassembly.github.io/spec/core/syntax/instructions.html#syntax-instr-variable */
      const local = localIndexForSymbol(node.value, false);
      return module.local.get(local);
    }
    case "subExpression": {
      return writeExpression(module, node.expression);
    }
  }
}

function writeProcStatement(module: Module, node: ProcStatement): number {
  // List every local variables used in this function
  const locals = getVariableDeclaration(node.statements);
  module.addFunctionExport(node.name, node.name);
  return module.addFunction(
    node.name,
    none,
    none,
    locals.map((_) => f32),
    module.block(
      null,
      node.statements.map((s) => writeStatement(module, s)),
    ),
  );
}

function writePrintStatement(module: Module, node: PrintStatement) {
  if (isWasi) {
    //
    //
    //    (i32.store (i32.const 1088) (local.get $p0))
    //    (i32.store (i32.const 1092) (local.get $l3))
    //    i32.const 1
    //    i32.const 1088
    //    i32.const 1
    //    i32.const 1096
    //    call $wasi_snapshot_preview1.fd_write
    const value = module.i32.const(66);
    const vptr = module.i32.const(10);
    const iovptr = module.i32.const(20);

    return module.drop(
      module.block(null, [
        module.i32.store(0, 0, vptr, value),
        module.i32.store16(0, 0, iovptr, vptr),
        module.i32.store16(0, 0, module.i32.const(24), module.i32.const(1)),
        module.call("echo", [
          module.i32.const(1),
          iovptr,
          module.i32.const(1),
          module.i32.const(1096),
        ], i32),
      ]),
      //module.call('echo', [
      //  module.i32.const(1), // fd
      //  // ptr-iov
      //  module.i32.load(offset, align, ptr), value, , ptr]),
    );
  }
  return module.call("echo", [writeExpression(module, node.expression)], none);
}

function writeVariableDeclarationAssignment(
  module: Module,
  node: VariableDeclarationAssignmentStatement,
) {
  const local = localIndexForSymbol(node.name, true);
  return module.local.set(local, writeExpression(module, node.value));
}

function writeVariableAssignment(
  module: Module,
  node: VariableAssignmentStatement,
): number {
  const local = localIndexForSymbol(node.name, false);
  return module.local.set(local, writeExpression(module, node.value));
}

function writeWhileStatement(
  module: Module,
  node: WhileStatement,
): number {
  /* https://developer.mozilla.org/en-US/docs/webassembly/reference/control_flow/loop */
  const exitBlock = `exitLoop${loopCount}`;
  const innerLoop = `innerLoop${loopCount}`;
  loopCount++;
  const loop = module.block(exitBlock, [
    module.loop(
      innerLoop,
      module.block(null, [
        module.br_if(
          exitBlock,
          module.i32.eqz(writeExpression(module, node.condition)),
        ),
        ...node.statements.map((s) => writeStatement(module, s)),
        module.br(innerLoop),
      ]),
    ),
  ]);

  return loop;
}

function writeStatement(module: Module, node: Statement): number {
  switch (node.type) {
    case "printStatement":
      return writePrintStatement(module, node);
    case "procStatement":
      return writeProcStatement(module, node);
    case "variableDeclarationAssignment":
      return writeVariableDeclarationAssignment(module, node);
    case "variableAssignment":
      return writeVariableAssignment(module, node);
    case "whileStatement":
      return writeWhileStatement(module, node);
    default:
      throw new Error("Unknown statement " + JSON.stringify(node));
  }
}

export function write(ast: AST, optimize = true) {
  const module = new binaryen.Module();
  module.setMemory(1, 2, "memory", []);
  if (isWasi) {
    module.addFunctionImport("echo", "wasi_snapshot_preview1", "fd_write", [
      i32,
      i32,
      i32,
      i32,
    ], i32);
  } else {
    module.addFunctionImport("echo", "env", "echo", [f32], none);
  }
  ast.forEach((node) => writeStatement(module, node));

  // Optimize the module using default passes and levels
  if (optimize) {
    module.optimize();
  }
  return {
    text: module.emitText(),
    bytecode: module.emitBinary(),
  };
}
