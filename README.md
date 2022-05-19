# Webassembly experiments

## Pixel language

A simple language using WASM backend, to experiments with WASM instructions.

🔗 [pixel-lang](./pixel-lang/)

```shell
cd pixel-lang
deno run -A --import-map=import_map.json src/index.ts examples/fizzbuzz.pix
npx http-server
iexplorer http://localhost:8080
```

## Simple Virtual Machine

A simple stack virtual machine designed with 3 instructions.

- `PUSH`: push a value on the stack
- `ADD`: pop 2 elements on the stack and push the sum
- `PRINT`: pop and print the last value on the stack

🔗 [svm](./svm/)

```shell
cd svm
node compiler.mjs
node runtime.mjs
```

## Interoperability

Simple example to showcase webassembly with other languages

🔗 [interoperability](./interoperability/)

### Python
```shell
cd interoperability/python
pip install wasmtime

# First example with autoload
wat2wasm hello.wat
python3 main.py 

# Second exmple with import functions
python3 pyxel.py
```
🔗 [interoperability with python](./interoperability/python)

### Rust
```shell
cd interoperability/rust
cargo run
```
🔗 [interoperability with rust](./interoperability/rust)

### NodeJS
```shell
cd interoperability/node
node index.js
```
🔗 [interoperability with node](./interoperability/node)

### Java

```shell
cd interoperability/java
mvn compile exec:java
```

#### Caveat:
Have to build the lib manualy because : 
- bintray repository listed in https://github.com/wasmerio/wasmer-java#install is not available
- Import function is still a pending feature: https://github.com/wasmerio/wasmer-java/pull/64

🔗 [interoperability with java](./interoperability/java)
