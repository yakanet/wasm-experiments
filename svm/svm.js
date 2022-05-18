const fs = require('node:fs/promises');

const INST_PUSH = 1
const INST_ADD = 2
const INST_PRINT = 3

let program = new Uint32Array([
    INST_PUSH, 32,
    INST_PUSH, 12,
    INST_ADD,
    INST_PRINT,
]);

function run() {
    console.table({program})
    let ip = 0
    const stack = [];
    while (ip < program.length) {
        switch (program[ip]) {
            case INST_PUSH:
                stack.push(program[++ip])
                break
            case INST_ADD:
                const a = stack.pop()
                const b = stack.pop()
                stack.push(a + b);
                break
            case INST_PRINT:
                console.log(stack.pop());
                break;
        }
        ip++
    }
}

async function compile() {
    await fs.writeFile('svm.bin', program);
}

async function evaluate() {
    const { buffer } = await fs.readFile('svm.bin');
    program = new Uint32Array(buffer)
}

async function main() {
    await compile();
    await evaluate();
    await run();
}
main();
