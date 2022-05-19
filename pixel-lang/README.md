# Pixel language

Simple compilator using WASM backend.

This compilator is written in Typescript (because why not) and has essentialy an educational purpose.

The language features come 

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

Credit : 
- https://www.youtube.com/watch?v=awe7swqFOOw : Youtube video that inspired me on this project