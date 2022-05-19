import type {
  AST,
  Expression,
  IfStatement,
  PrintStatement,
  ProcStatement,
  Statement,
  VariableAssignmentStatement,
  VariableDeclarationAssignmentStatement,
  WhileStatement,
} from "./parser.ts";
import { Operator } from "./grammar.ts";
import { getVariableDeclaration } from "./util.ts";
import binaryen from "binaryen";

type Module = binaryen.Module;
type ExpressionRef = binaryen.ExpressionRef;
const { none, f32 } = binaryen;

const symbols = new Map<string, number>();
let loopCount = 0;

const localIndexForSymbol = (name: string, create = true) => {
  if (!symbols.has(name)) {
    if (create) symbols.set(name, symbols.size);
    else throw new Error("Unknown identifier " + name);
  }
  return symbols.get(name)!;
};

function writeExpression(module: Module, node: Expression): ExpressionRef {
  switch (node.type) {
    case "numberLiteral": {
      /** https://webassembly.github.io/spec/core/syntax/instructions.html#syntax-instr-numeric */
      return module.f32.const(node.value);
    }
    case "binaryExpression": {
      /** https://webassembly.github.io/spec/core/syntax/instructions.html#syntax-instr-numeric */
      const handlers: Record<Operator, (left: ExpressionRef, right: ExpressionRef) => ExpressionRef> = {
        "+": (l, r) => module.f32.add(l, r),
        "*": (l, r) => module.f32.mul(l, r),
        "-": (l, r) => module.f32.sub(l, r),
        "/": (l, r) => module.f32.div(l, r),
        "<": (l, r) => module.f32.lt(l, r),
        ">": (l, r) => module.f32.gt(l, r),
        "<=": (l, r) => module.f32.le(l, r),
        ">=": (l, r) => module.f32.ge(l, r),
        "<<": (l, r) => module.i32.shl(l, r),
        ">>": (l, r) => module.i32.shr_s(l, r),
        "&&": (l, r) => module.i32.and(l, r),
        "||": (l, r) => module.i32.or(l, r),
        "==": (l, r) => module.f32.eq(l, r),
        "%": (l, r) => module.f32.convert_u.i32(module.i32.rem_u(module.i32.trunc_s.f32(l), module.i32.trunc_s.f32(r))),
        "=": (l, r) => module.unreachable(),
      };
      if (node.value in handlers) {
        return handlers[node.value](
          writeExpression(module, node.left),
          writeExpression(module, node.right),
        );
      }
      throw new Error("Unknown binary operation " + node.value);
    }
    case "identifier": {
      /** https://webassembly.github.io/spec/core/syntax/instructions.html#syntax-instr-variable */
      const local = localIndexForSymbol(node.value, false);
      return module.local.get(local, 0);
    }
    case "subExpression": {
      return writeExpression(module, node.expression);
    }
  }
}

function writeProcStatement(
  module: Module,
  node: ProcStatement,
): ExpressionRef {
  // List every local variables used in this function
  const locals = getVariableDeclaration(node.statements);
  if (node.export) {
    module.addFunctionExport(node.name, node.name);
  }
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

function writePrintStatement(
  module: Module,
  node: PrintStatement,
): ExpressionRef {
  return module.call("echo", [writeExpression(module, node.expression)], none);
}

function writeVariableDeclarationAssignment(
  module: Module,
  node: VariableDeclarationAssignmentStatement,
): ExpressionRef {
  const local = localIndexForSymbol(node.name, true);
  return module.local.set(local, writeExpression(module, node.value));
}

function writeVariableAssignment(
  module: Module,
  node: VariableAssignmentStatement,
): ExpressionRef {
  const local = localIndexForSymbol(node.name, false);
  return module.local.set(local, writeExpression(module, node.value));
}

function writeIfStatement(
  module: Module,
  node: IfStatement,
): ExpressionRef {

  if (!node.elseStatements.length) {
    // case if only
    const ifBlock = `exitIf${loopCount}`;
    loopCount++;
    const condition = module.block(ifBlock, [
      module.br_if(ifBlock, module.i32.eqz(writeExpression(module, node.condition))),
      ...node.ifStatements.map(s => writeStatement(module, s)),
    ])
    return condition
  } else {
    // case if else
    const exitBlock = `exitCondition${loopCount}`;
    const ifBlock = `exitIf${loopCount}`;
    loopCount++;
    const condition = module.block(exitBlock, [
      module.block(ifBlock, [
        module.br_if(ifBlock, module.i32.eqz(writeExpression(module, node.condition))),
        ...node.ifStatements.map(s => writeStatement(module, s)),
        module.br(exitBlock)
      ]),
      ...node.elseStatements.map(s => writeStatement(module, s)),
    ])
    return condition;
  }
  // TODO case elif

}

function writeWhileStatement(
  module: Module,
  node: WhileStatement,
): ExpressionRef {
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

function writeStatement(module: Module, node: Statement): ExpressionRef {
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
    case "ifStatement":
      return writeIfStatement(module, node);
    default:
      throw new Error("Unknown statement " + JSON.stringify(node));
  }
}

export function write(ast: AST, optimize = true) {
  const module = new binaryen.Module();
  module.setMemory(1, 2, "memory", []);
  module.addFunctionImport("echo", "env", "echo", f32, none);
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
