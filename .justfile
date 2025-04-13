registry := "registry.territoriolinux.es"
user     := "atareao"
name     := `basename ${PWD}`
version  := `git tag -l  | tail -n1`


list:
    @just --list

dev:
    cd front && pnpm i && pnpm run build && rm -rf ../back/static && mkdir ../back/static && cp -r ./dist/* ../back/static
    cd back && RUST_LOG=debug cargo run

front:
    cd front && pnpm run dev

back:
    cd back && RUST_LOG=debug cargo run

build:
    @docker build \
        --tag={{registry}}/{{user}}/{{name}}:{{version}} \
        --tag={{registry}}/{{user}}/{{name}}:latest .

push:
    @docker image push --all-tags {{registry}}/{{user}}/{{name}}
