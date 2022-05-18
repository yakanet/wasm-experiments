const fs = require('node:fs/promises');

const INST_PUSH = 1
const INST_ADD = 2
const INST_PRINT = 3

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
                console.log("Result :" , value);
                // Debug purpose
                debug.push({ program: [program[ip]], description: 'PRINT POP', stack: [...stack] });
                break;
        }
        ip++
    }
    console.table(debug);
}

async function compile() {
    const program = new Uint32Array([
        INST_PUSH, 30,
        INST_PUSH, 12,
        INST_PUSH, 19,
        INST_ADD,
        INST_PRINT,
    ]);
    await fs.writeFile('svm.bin', program);
}

async function evaluate() {
    const { buffer } = await fs.readFile('svm.bin');
    return new Uint32Array(buffer)
}

async function main() {
    await compile();
    const program = await evaluate();
    await run(program);
}

try {
    main();
} catch (e) {
    console.error(e);
}

