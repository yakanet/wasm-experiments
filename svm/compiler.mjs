//@ts-check
import fs from 'node:fs';
import { INST_ADD, INST_PUSH, INST_PRINT } from './common.mjs'

/**
 * @typedef {'NUMBER' | 'OPERATOR' | 'KEYWORD'} TokenType
 * @typedef {{type: TokenType, value: string}} Token
 * @typedef {{type: 'numberLiteral',value: number }} NumberLiteral
 * @typedef {{
 *  type: 'binaryExpression',
 *  left: Expression,
 *  right: Expression,
 *  operator: number
 * }} BinaryExpression
 * @typedef {NumberLiteral | BinaryExpression} Expression
 * @typedef {{
 *      type: 'printFunction',
 *      value: Expression,
 * }} EchoStatement
 * @typedef {EchoStatement} Statement
 */

/**
 * Convert a string source in to a list of tokens
 * @param {string} source 
 * @returns {Token[]}
 */
function tokenize(source) {
    return source.split(/\s+/).map(token => {
        /** @type {TokenType} */
        let tokenType;
        if (token === '+') tokenType = 'OPERATOR';
        else if (token === 'echo') tokenType = 'KEYWORD';
        else if (!isNaN(Number(token))) tokenType = 'NUMBER';
        else throw new Error('Unrecognized token ' + token)
        return {
            type: tokenType,
            value: token
        };
    });
}

/**
 * Convert a list of token into a tree of operation
 * @param {Token[]} tokens 
 */
function parse(tokens) {
    let ti = 0;
    /** @type Statement[] */
    let ast = [];
    /** @type Expression[] */
    let lefts = []

    const parseExpression = () => {
        switch (tokens[ti]?.type) {
            case 'OPERATOR': {
                if (lefts.length === 0) throw new Error('An operator should be used after a number')
                const { value: operator } = tokens[ti];
                ti++
                return {
                    type: 'binaryExpression',
                    operator,
                    left: lefts.pop(),
                    right: parseExpression(),
                }
            }

            case 'NUMBER': {
                /** @type {NumberLiteral} */
                const left = { type: 'numberLiteral', value: Number(tokens[ti].value) };
                ti++;
                if (tokens[ti]?.type === 'OPERATOR') {
                    lefts.push(left);
                    return parseExpression();
                }
                return left;
            }
        }
        throw new Error('Unknown token type ' + JSON.stringify(tokens[ti]))
    }

    while (ti < tokens.length) {
        if (tokens[ti]?.type === 'KEYWORD' && tokens[ti].value === 'echo') {
            ti++;
            ast.push({
                type: 'printFunction',
                value: parseExpression(),
            })
        }
        else {
            throw new Error('Unexpected token ' + JSON.stringify(tokens[ti]));
        }
    }
    return ast;
}

function writeBytecode(ast, bytecode = []) {
    for (let inst of ast) {
        if (inst.type === 'numberLiteral') {
            bytecode.push(INST_PUSH)
            bytecode.push(inst.value)
        }
        if (inst.type === 'binaryExpression') {
            writeBytecode([inst.left, inst.right], bytecode);
            bytecode.push(INST_ADD)
        }
        if (inst.type === 'printFunction') {
            writeBytecode([inst.value], bytecode);
            bytecode.push(INST_PRINT)
        }
    }
    return bytecode;
}


function main() {
    if (process.argv.length !== 3) {
        console.error("Usage node compiler.mjs <SOURCEFILE>.svm");
        console.log(process.argv)
        process.exit(1);
    }
    const source_path = process.argv.at(-1);
    const output_prefix = source_path.replace(/\.svm$/, '');

    // Slurp file
    const source = fs.readFileSync('./source.svm', { encoding: 'utf-8' });

    // Split source into tokens
    const tokens = tokenize(source);
    fs.writeFileSync(`${output_prefix}_token.json`, JSON.stringify(tokens, null, 2));

    // Turn tokens into syntax tree
    const ast = parse(tokens);
    fs.writeFileSync(`${output_prefix}_ast.json`, JSON.stringify(ast, null, 2));

    // Convert syntax tree into bytecode
    const byteCode = writeBytecode(ast);
    fs.writeFileSync(`${output_prefix}.bin`, new Uint32Array(byteCode));
}

try {
    main();
    console.log(`%cCompilation successful`, 'color: green');
} catch (err) {
    console.log(`%c[ERROR] ${err.message}`, 'color: red');
}