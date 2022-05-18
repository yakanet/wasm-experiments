from wasmtime import Func, FuncType, Instance, Store, Module, ValType

# Define Import function
def echo(value):
    print(value)

# Load wasm file
store = Store()
wasm_file = open("../pixel-lang/examples/hello.wasm", "rb")
module = Module(store.engine,  wasm_file.read())
wasm_file.close()

# Create instance
instance = Instance(store, module, [
    Func(store, FuncType([ValType.f32()], []), echo)
])

# Get main function
main = instance.exports(store).get('main')
main(store)