# security-deps

## Qué es

Remediación de las 84 alertas de Dependabot del repositorio: **79 npm** (48 high, 31 moderate, 5 low en `front/`) y **5 Rust** (en `back/`). Objetivo: dejar `pnpm audit` a cero y actualizar los crates afectados sin saltos major innecesarios.

## Ficheros implicados

| Fichero | Motivo |
|---|---|
| `back/Cargo.lock` | Bumps de crates con `cargo update -p <crate> --precise <ver>` |
| `front/package.json` | Rangos de dependencias actualizados + `packageManager: pnpm@12.15.0` |
| `front/pnpm-lock.yaml` | Lockfile regenerado; incluye `packageManagerDependencies` (pnpm 12.15.0) |
| `front/pnpm-workspace.yaml` | `overrides` y migración `onlyBuiltDependencies` → `allowBuilds` |

## Cómo funciona

**Rust.** Sin tocar `Cargo.toml`; se fija la versión mínima parcheada en el lockfile:

```sh
cd back
cargo update -p bytes --precise 1.11.1
cargo update -p jsonwebtoken --precise 10.3.0
# ...
```

**npm.** Dos pasos:

1. `pnpm update` (sin `--latest`): refresca todo dentro del rango semver de `package.json` y actualiza los specifiers `^`. Esto resolvió 79 de las alertas.
2. `overrides` en `front/pnpm-workspace.yaml` para lo que no tenía parche dentro de rango:
   - pnpm 12 **ya no lee** `pnpm.overrides` de `package.json` (emite un WARN y lo ignora); el bloque debe ir en `pnpm-workspace.yaml` (o `pnpm-workspace.yml`).
   - Se scopó `minimatch@^10.0.0` para no alterar la `minimatch@3.x` que sigue usando ESLint.

**Build scripts.** pnpm 12 eliminó `onlyBuiltDependencies`; la lista se migró a `allowBuilds` (mismo set: `@parcel/watcher`, `@swc/core`, `es5-ext`, `esbuild`). Sin esto `pnpm install` aborta con `ERR_PNPM_IGNORED_BUILDS`.

## Cambios

### Rust (`back/Cargo.lock`)

| Crate | Antes | Después |
|---|---|---|
| bytes | 1.11.0 | 1.11.1 |
| jsonwebtoken | 10.2.0 | 10.3.0 |
| rand | 0.8.5 | 0.8.6 |
| rsa | 0.9.9 | 0.9.10 |
| time | 0.3.44 | 0.3.47 |
| tracing-subscriber | 0.3.22 | 0.3.23 |

### npm (`front/`) — más relevantes

| Paquete | Antes | Después |
|---|---|---|
| react / react-dom | 19.2.1 | 19.3.1 |
| react-router | 7.10.1 | 7.18.5 |
| vite | 6.4.1 | 6.4.5 |
| i18next-http-backend | 3.0.2 | 4.0.10 (major, drop-in) |
| antd | 6.0.1 | 6.7.0 |
| @blocknote/core·react·mantine | 0.44.0 | 0.44.2 |
| typescript-eslint | 8.48.1 | 8.72.1 |
| sass-embedded | 1.93.3 | 1.108.0 |
| eslint / @eslint/js | 9.39.1 | 9.39.5 |

Transitivas que quedaron parcheadas solo por el refresco: `brace-expansion`, `picomatch`, `flatted`, `immutable`, `ajv`, `js-yaml`, `nanoid`, `postcss`, `source-map-js`, `prosemirror-view`, `@tiptap/core`, `rollup`.

### Overrides (`front/pnpm-workspace.yaml`)

```yaml
overrides:
  uuid@^8.0.0: 11.1.1           # @blocknote/core pedía ^8.3.2; solo usa v4(); el rango acota el major
  minimatch@^10.0.0: 11.0.1     # rama 10.x sin parche; consumidor dev (typescript-eslint)
```

`minimatch@11` es ESM-only y lo consume `typescript-estree` vía `require()`; funciona con el *require(ESM)* de Node ≥ 20.19 / 22.12 (el proyecto usa Node 24). Verificado con `pnpm lint`.

## Verificación

| Comando | Resultado |
|---|---|
| `cd front && pnpm install --frozen-lockfile` | OK, lockfile up to date |
| `pnpm audit` | 0 advisories (0 critical/high/moderate/low) |
| `pnpm build` (`tsc -b && vite build`) | OK |
| `cd back && cargo check` | OK |
| `podman build --target client-builder .` | OK (pnpm 12.x vía corepack) |
| `podman run --rm node:22-slim sh -lc 'corepack enable && corepack prepare pnpm@12.15.0 --activate && pnpm -v'` | `12.15.0` |

Preexistentes, ajenos a este cambio:

- `pnpm lint`: **78 errores** (`no-explicit-any`, `no-unsafe-function-type`, `no-empty-object-type`, `no-unused-vars`, `no-unused-expressions`). Idénticos antes y después (comprobado reinstalando el lockfile original).
- `cargo clippy -- -D warnings`: **12 avisos** preexistentes.

## Residuales y follow-ups

- `braces@3.0.3` permanece en el árbol: no tiene parche publicado, pero **no tiene advisory activo** (`pnpm audit` limpio). No se forzó.
- Los 78 errores de lint y los 12 avisos de clippy deben tratarse en tareas separadas.
- Las alertas de GitHub/Dependabot **solo se cierran tras el merge a `development` y el reanálisis posterior**; hasta entonces el panel seguirá mostrándolas.
- `uuid` va por override a la rama 11, pero acotado con la clave `uuid@^8.0.0`, así que no afecta a futuros consumidores que declaren uuid 9+; solo aplica a `@blocknote/core`. Si `@blocknote` sube de versión, revisar si el override sigue siendo necesario.

## Cómo desplegar / revertir

- **Desplegar:** rebuild de la imagen (`podman build .`); el stage `client-builder` instala con corepack + `pnpm install --frozen-lockfile` usando la versión fijada en `packageManager`.
- **Revertir:** revertir el PR completo (manifests, lockfiles y `pnpm-workspace.yaml` van juntos; revertir solo uno deja lock y manifiesto desincronizados y rompe `--frozen-lockfile`).