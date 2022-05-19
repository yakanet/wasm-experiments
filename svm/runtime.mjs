import fs from 'node:fs/promises';

import { INST_ADD, INST_PRINT, INST_PUSH } from './common.mjs';

function run(program) {
    let ip = 0
    const stack = [];
    const debug = []
    while (ip < program.length) {
        switch (program[ip]) {
            case INST_PUSH: {
                const operand = program[++ip];
                stack.push(operand);
                // Debug purpose
                debug.push({ program: [program[ip - 1], program[ip]], description: `PUSH ${operand}`, stack: [...stack] })
                break
            }
            case INST_ADD: {
                const a = stack.pop()
                const b = stack.pop()
                stack.push(a + b);
                // Debug purpose
                debug.push({ program: [program[ip]], description: 'ADD POP POP', stack: [...stack] })
                break
            }
            case INST_PRINT:
                const value = stack.pop()
                console.log("Result :", value);
                // Debug purpose
                debug.push({ program: [program[ip]], description: 'PRINT POP', stack: [...stack] });
                break;
        }
        ip++
    }
    console.table(debug);
}

async function load() {
    const { buffer } = await fs.readFile('source.bin');
    return new Uint32Array(buffer)
}

async function main() {
    const program = await load();
    await run(program);
}

try {
    main();
} catch (e) {
    console.error(e);
}

