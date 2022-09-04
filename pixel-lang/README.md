# Pixel language

Simple compiler using WASM backend.

This compiler is written in Typescript (because why not) and has essentially an educational purpose.

Features:
- [x] Tokenizer
- [x] Parser
- [x] Write WASM instructions
- [x] Variables (only f32 types)
- [x] Comments
- [x] While loop
- [x] Conditions
- [x] Parser
- [ ] Manage multiples types (i32, f32, bool) - Add type checking
- [ ] Support string
- [ ] Arrays
- [ ] Structure
- [ ] Compatibility with WASI? (use fd_write instead of echo?)
- [ ] Fix broken optimized WASM when using while or if structures


## How to start
```shell
deno run -A --import-map=import_map.json src/index.ts examples/hello.pix
```

## Credit : 
- https://www.youtube.com/watch?v=awe7swqFOOw : Youtube video that inspired me on this project
