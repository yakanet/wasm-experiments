import fs from 'node:fs';

const wasm_bytes = fs.readFileSync('../../pixel-lang/examples/fizzbuzz.wasm')

const {instance} = await WebAssembly.instantiate(wasm_bytes, {
    env: {
        echo: (param) => console.log(param)
    }
})

instance.exports.main()