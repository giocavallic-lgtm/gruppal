# Crewzy

App web móvil (PWA) para grupos de amigos o familias: planes con tareas y fechas, división de gastos/pagos y apuestas privadas entre amigos.

## Funcionalidades

- **Cuentas y sincronización real**: email + contraseña con Supabase. Crea el grupo en tu móvil y tus amigos se unen desde el suyo con un código de invitación.
- **Grupos**: crea grupos e invita con un código de 8 caracteres.
- **Planes**: título, descripción, fecha. Tareas con asignación, estado (por hacer/en curso/hecho) y fecha límite.
- **División de pagos**: registra gastos, quién pagó y entre quiénes se divide; cálculo de balances y liquidación sugerida.
- **Apuestas privadas**: crea apuestas sobre un miembro del grupo; esa persona no puede ver la apuesta (oculto en la interfaz y bloqueado en la base de datos con RLS). Otros miembros votan/apuestan. Resolución por el creador.
- **Offline / local**: si no hay Supabase configurado, la app funciona en modo local con exportar/importar backup.

## Uso

Abre la app en el móvil y añade a pantalla de inicio (PWA).

- Repo: https://github.com/giocavallic-lgtm/gruppal
- App: https://giocavallic-lgtm.github.io/gruppal/

## Backend (Supabase)

El proyecto ya está creado y el esquema aplicado (`supabase/schema.sql`).

- `src/config.ts` contiene la URL y la clave publicable (segura para cliente).
- `.env.local` (no versionado) permite sobreescribir `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
- Si necesitas recrear la base de datos, ejecuta `supabase/schema.sql` en el SQL Editor de Supabase.

### Tablas

`profiles`, `groups`, `group_members`, `plans`, `tasks`, `expenses`, `bets`, `bet_options`, `bet_wagers`.

Las apuestas están protegidas por RLS: `target_user_id <> auth.uid()` en lectura, de modo que la persona objetivo no recibe la apuesta ni por API.

### Invitaciones

Cada grupo tiene un `invite_code`. La función `join_group_by_code(code)` (SECURITY DEFINER) añade al usuario autenticado al grupo.

## Desarrollo

```bash
npm install
npm run dev
npm run build
```

Color principal: tonos de grises.
