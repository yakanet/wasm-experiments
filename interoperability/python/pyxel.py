from wasmtime import Func, FuncType, Instance, Store, Module, ValType

# Load wasm file
store = Store()
module = Module.from_file(store.engine, "../../pixel-lang/examples/fizzbuzz.wasm")

# Define Import function
def echo(value):
    print(value)
    
import_object = [
    Func(store, FuncType([ValType.f32()], []), echo)
]

# Create instance
instance = Instance(store, module, import_object)

# Get main function
main = instance.exports(store).get('main')
main(store)