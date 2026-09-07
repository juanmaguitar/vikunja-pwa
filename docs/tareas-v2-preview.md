# Tareas v2 preview

The `design/tareas-v2` branch restyles the existing client. It uses the existing
Vikunja API and authentication flows. Task lists, navigation, sign-in, and both
colour themes share the blue/slate palette. The desktop inspector starts
collapsed for a new browser and opens when a task or project is selected.

Selecting a task now exposes title, project, completion/favorite state, due date,
labels, assignees, notes, comments, and attachments in the central task body.
Related tasks, planning, reminders, recurrence, and audit metadata remain in the
inspector (under **Task settings** on mobile). Essential sections do not need
expanding. Notes save on blur; comments have an explicit submit action.

One task editor owns the drafts and mutations, using React portals to place
essential fields in the focused screen. Collapsing the inspector keeps that
editor mounted. Attachment previews use a body-level portal so hidden settings
cannot hide the viewer. Returning to the collection closes the mobile editor.

## Try it

Open <https://coolify-vps.tail96bc47.ts.net:8450> with Tailscale connected and sign
in with your existing Vikunja account. This is a separate app origin with its own
session volume and browser cache. **It uses your real Vikunja data:** edits here
also appear in the original clients.

The existing public app at <https://app.tareas.juanma.rocks> stays on its current
release. The preview is a standalone Docker Compose project on the same Hetzner
host, outside Coolify's production application and automatic deployment flow.

## Operate the preview

Source directory on the host: `/opt/tareas-v2-preview`.

```sh
cd /opt/tareas-v2-preview
docker compose -f docker-compose.preview.yml up -d --build --wait
tailscale serve --bg --https=8450 http://127.0.0.1:8288
docker compose -f docker-compose.preview.yml ps
curl --fail http://127.0.0.1:8288/health
```

Before shipping a new source archive, run
`node scripts/generate-build-info.mjs --require-git` in the committed local
checkout and include `build-info.json` alongside it. The existing Dockerfile
preserves that stamp during the build.

Docker publishes only on loopback. Tailscale terminates HTTPS on port 8450.
The app has no preconfigured API token or admin bridge; each person signs in.
The preview stores its own encrypted sessions in the project-scoped
`preview_sessions` volume. Both Docker and Tailscale Serve persist across reboots.

To stop just this preview while retaining its sessions:

```sh
tailscale serve --https=8450 off
cd /opt/tareas-v2-preview
docker compose -f docker-compose.preview.yml stop
```

## Validation

```sh
npm ci
npx playwright install chromium
npm run lint
npm run build
npx playwright test tests/smoke/react-design.react.smoke.spec.js tests/smoke/react-auth.react.smoke.spec.js tests/smoke/react-tasks.react.smoke.spec.js tests/smoke/ui.smoke.spec.js
npx playwright test tests/smoke/react-dnd.react.smoke.spec.js
npm run test:unit
npx playwright test tests/smoke/react-task-workspace.react.smoke.spec.js tests/smoke/react-task-detail.react.smoke.spec.js
```

The design tests exercise the initial inspector state, selection and persistence,
mobile task completion/navigation, and sign-in layout at 390px and 1440px in both
themes. They save screenshots in `test-results/playwright-artifacts`.

Task workspace tests cover notes/comments, labels/assignees, clearing and setting
due dates, uploading/previewing attachments, collapsed-inspector persistence,
and switching tasks at 390px and 1440px. The existing detail suite still covers
advanced planning, reminders, recurrence, subscriptions, and comment reactions.
Standalone `tsc --noEmit` has existing errors on the preceding commit as well
(including reminders, views, and security types); it is not currently a clean
project-wide validation gate. Vite build, lint, and the targeted browser suites
pass for this update.

Sidebar drops defer the optimistic move until the pointerup/mouseup/click event
sequence finishes. Otherwise removing the dragged node can leave Sortable's
fallback click guard armed and swallow the user's next navigation click. The
existing sidebar-drop smoke test reproduces and covers this regression.

Visual changes can affect long titles, nested tasks, menus, and the mobile
keyboard. The existing smoke suite covers task actions, pane resizing, drag and
drop, authentication, and composers. Check the installed PWA on a physical iPhone
for keyboard/safe-area behaviour before promoting this branch to production.
