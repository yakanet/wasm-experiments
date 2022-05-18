# Webassembly experiments

## Pixel language

A simple language using WASM backend, to experiments with WASM instructions.

🔗 [pixel-lang](./pixel-lang/)

```shell
deno run -A index.ts examples/hello.pix
npx http-server
iexplorer http://localhost:8080
```

## Simple Virtual Machine

A simple virtual machine designed with 3 instructions.

🔗 [svm](./svm/)

## Interoperability

Simple example to showcase webassembly in python

🔗 [interoperability](./interoperability/)

```shell
pip install wasmtime
wat2wasm hello.wat
python3 main.py
```