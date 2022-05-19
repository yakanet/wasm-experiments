import { VariableDeclarationAssignmentStatement } from "./parser.ts";
export const extension = "pix";
const extensionRegexp = new RegExp(`\.${extension}$`);

export function out(strings: object, path: string) {
  const [prefix, suffix] = Object.values(strings);
  return `${prefix}${path.replace(extensionRegexp, suffix)}`;
}

/**
 * Simple utility function to pretty print an object into json
 * @param object Object to jsonify
 * @returns json string
 */
export const json = (object: any) => JSON.stringify(object, null, 2);

/**
 * Check if the node is a DeclarationExpression Node
 * @param node node to check
 * @returns
 */
function isDeclarationExpression(
  node: any,
): node is VariableDeclarationAssignmentStatement {
  return node?.type === "variableDeclarationAssignment";
}

/**
 * Parse every nodes looking for a variable declaration
 * @param nodes
 * @returns
 */
export function getVariableDeclaration(
  inodes: unknown | unknown[],
): VariableDeclarationAssignmentStatement[] {
  const nodes = Array.isArray(inodes) ? inodes : [inodes];
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
