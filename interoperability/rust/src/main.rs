use std::error::Error;
use wasmer::*;

fn main() -> Result<(), Box<dyn Error>> {
    // Load wasm file
    let store = Store::default();
    let module = Module::from_file(&store, "../../pixel-lang/examples/hello.wasm")?;

    // Define Import function
    let import_object = imports! {
        "env" => {
            "echo" => Function::new_native(&store, |param: f32| println!("{}", param)),
        },
    };

    // Create instance
    let instance = Instance::new(&module, &import_object)?;

    // Get main function
    let wasm_main = instance.exports.get::<Function>("main")?;
    wasm_main.call(&[])?;
    Ok(())
}
