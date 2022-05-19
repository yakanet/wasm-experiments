package com.github.yakanet;

import org.wasmer.Imports;
import org.wasmer.Module;
import org.wasmer.Type;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.List;

public class App {
    public static void main(String[] args) throws IOException {
        var wasmPath = Paths.get("../../pixel-lang/examples/fizzbuzz.wasm");
        var wasmBytes = Files.readAllBytes(wasmPath);

        var module = new Module(wasmBytes);
        var imports = Imports.from(List.of(
                new Imports.Spec("env", "echo", argv -> {
                    System.out.println(argv.get(0));
                    return argv;
                }, List.of(Type.F32), List.of())
        ), module);
        var instance = module.instantiate(imports);
        var main = instance.exports.getFunction("main");
        main.apply();
    }
}
