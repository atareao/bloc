# PLAN-001 — Remediación de 84 vulnerabilidades (Dependabot)

## Contexto
Repo: `atareao/bloc` (Rust `back/` + React/TS `front/` con pnpm).
Estado: 84 alertas Dependabot abiertas → 79 npm + 5 Rust. Severidad: 46 high, 29 medium, 9 low.
Rama de trabajo: `fix/security-deps` (desde `development`). `main` y `development` protegidas: solo PR.
14 PRs de Dependabot abiertas (#3, #6-#20) quedan obsoletas con este cambio; se cerrarán tras el merge.

## Objetivos
- G1: 0 alertas Dependabot con parche disponible (Rust y npm).
- G2: Builds verdes: `cargo check`, `cargo clippy -- -D warnings`, `cargo test`; `pnpm build`, `pnpm lint`; `pnpm audit` sin high/critical.
- G3: Un único PR a `development` siguiendo gitflow; sin commits directos.

## Estado inicial conocido
Rust (`back/`): bytes 1.11.0→1.11.1, jsonwebtoken 10.2.0→10.3.0, rand 0.8.5→0.8.6, rsa 0.9.9→0.9.10, time 0.3.44→0.3.47. tracing-subscriber 0.3.22→0.3.29 (PR #3).
npm (`front/pnpm-lock.yaml`): 84 advisories. Directas y dentro de rango declarado: react-router ^7.10.1→7.18.0, vite ^6.4.1→6.4.4, i18next-http-backend ^3.0.2→3.0.5. Transitivas a forzar con `pnpm.overrides`: brace-expansion ≥2.1.7, minimatch, picomatch ≥2.3.2/4.0.4, flatted ≥3.4.2, immutable ≥5.1.8, ajv ≥6.14.0, markdown-it ≥14.1.1, linkify-it ≥5.0.2, js-yaml ≥4.3.2, nanoid ≥3.3.18, postcss ≥8.5.23, source-map-js ≥1.2.2, prosemirror-view ≥1.42.3, @tiptap/core ≥3.30.5, rollup ≥4.59.0, moment ≥2.31.0, uuid ≥11.1.1, @humanfs/node ≥0.16.8. `braces` no tiene parche: se documenta como residual.

## Tareas
- [x] T1: Crear rama `fix/security-deps` desde `development `.
- [x] T2: backend-dev: actualizar crates Rust con `cargo update -p <crate> --precise <ver>`; verificar `cargo check`, `cargo clippy -- -D warnings`, `cargo test`; commit `🔒️ fix(back): actualiza dependencias vulnerables `.
- [x] T3: frontend-dev: refrescar lockfile (`pnpm update`), añadir `pnpm.overrides` necesarias e iterar hasta `pnpm audit` sin high/medium; verificar `pnpm build` y `pnpm lint`; commit `🔒️ fix(front): actualiza dependencias vulnerables `.
- [x] T4: Verificar con `gh api repos/atareao/bloc/dependabot/alerts?state=open` que no quedan alertas con parche; documentar residuales en `docs/security-deps.md `.
- [x] T5: Push de la rama y PR a `development` (`gh pr create`), con resumen de paquetes y residuales.
- [x] T6: Tras merge, cerrar PRs de Dependabot obsoletas y re-verificar alertas.

## Criterios de aceptación
- `pnpm audit` sin high/medium; Rust sin alertas con parche.
- `pnpm build`, `pnpm lint`, `cargo check`, `cargo clippy`, `cargo test` en verde.
- PR abierto a `development` con la lista de cambios.
- Residual `braces` documentado con justificación y mitigación.

## Resultado

- PR #21 (`fix/security-deps` → `development`) mergeado: commit `f1e9776`.
- PR #22 (`development` → `main`) mergeado: commit `a410504`.
- Alertas Dependabot: **84 → 0** (`gh api .../dependabot/alerts?state=open` = 0).
- 14 PRs de Dependabot cerradas (#3, #6-#12, #14-#16, #18-#20).
- Verificación: `pnpm audit` 0 advisories, `pnpm build` OK, `cargo check --all-targets` OK, `podman build --target client-builder` OK.
- Residuales: `braces` sin parche (sin advisory activo), 78 errores de lint y 12 avisos de clippy preexistentes, MSRV de `time` 1.88 sin toolchain fijada.