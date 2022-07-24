(module
  (func $add (param $a i32) (param $b i32) (result i32)
    local.get $a
    local.get $b
    i32.add)
  (export "add" (func $add))
)
;; 컴파일 커맨드: npx -p wabt wat2wasm add.wat -o add.wasm 
