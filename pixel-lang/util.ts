import { VariableDeclarationAssignmentStatement } from "./parser.ts";
export const extension = "pix";
const extensionRegexp = new RegExp(`\.${extension}$`);

export function out(strings: object, path: string) {
  const [prefix, suffix] = Object.values(strings);
  return `${prefix}${path.replace(extensionRegexp, suffix)}`;
}

export function randomId(length = 10) {
  let result = "";
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

export const json = (object: any) => JSON.stringify(object, null, 2);

function isDeclarationExpression(
  node: any,
): node is VariableDeclarationAssignmentStatement {
  return node?.type === "variableDeclarationAssignment";
}

export function getVariableDeclaration(
  nodes: any | any[],
): VariableDeclarationAssignmentStatement[] {
  nodes = Array.isArray(nodes) ? nodes : [nodes];
  const result: VariableDeclarationAssignmentStatement[] = [];
  for (let node of nodes) {
    if (isDeclarationExpression(node)) {
      result.push(node);
      continue;
    }
    for (let key of Object.keys(node)) {
      if (Array.isArray(node[key]) || typeof node[key] === "object") {
        getVariableDeclaration(node[key]).forEach((n) => result.push(n));
      }
    }
  }
  return result;
}
