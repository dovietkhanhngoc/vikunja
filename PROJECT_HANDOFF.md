# Personal Task PWA — Project handoff

Last updated: 2026-09-22

This file is the source of truth for continuing this project in another Codex task. Read it together with the repository `AGENTS.md` before making changes.

## Locked decisions

- Product strategy: extend a fork of Vikunja; do not rebuild the application or replace its backend with Supabase.
- Intended use: personal/non-commercial. The upstream AGPL-3.0-or-later license is accepted for this use.
- Connectivity model: online-first. A user must be able to enter supported task information while offline; changes are queued locally and synchronized after connectivity returns.
- Offline MVP is not a full multi-device-first database. It needs a visible outbox, retry, and conflict-safe behavior. Silent last-write-wins data loss is not acceptable.
- Current operating cost target: zero. Prefer self-hosting, SQLite, the existing Vue/Go stack, and free APIs. Do not introduce paid managed services.
- Google Calendar integration is explicitly deferred to phase 2.
- Telegram is part of the MVP direction. Use the free Telegram Bot API and the existing reminder event pipeline.

## Repository state

- Fork: https://github.com/dovietkhanhngoc/vikunja
- `origin`: the fork above.
- `upstream`: https://github.com/go-vikunja/vikunja.git
- Working branch: `codex/personal-task-pwa`
- Upstream starting commit: `021e66d6991f0ff05c8c92a5d8c585d69dc887f0`
- Architecture: Go API in `pkg/`; Vue 3 + TypeScript frontend in `frontend/`; pnpm; Vite PWA/Workbox.
- Local frontend dependencies were installed with `corepack pnpm install --frozen-lockfile`.
- Local runtime has Node 24 and pnpm 11.27.0. Go 1.27 and Mage were not installed when this handoff was written, so backend tests cannot yet be run locally.

## Existing capabilities to preserve and reuse

- Projects, tasks, Inbox, Upcoming/overdue views, recurrence, and multiple reminders.
- Rich-text editing through Tiptap.
- File attachments plus image, PDF, video, and audio previews.
- PWA manifest and service worker.
- Reminder cron/event infrastructure, including `TaskReminderFiredEvent` and webhook coverage.

Do not duplicate these features. Extend their existing models, services, events, and UI components.

## Confirmed gaps

1. Direct Telegram delivery and account/chat linking.
2. A local offline outbox for supported task mutations, with reconnect synchronization and conflict handling.
3. A documented zero-cost deployment path and personal-product defaults.
4. Google Calendar synchronization, only in phase 2.

Browser audio recording is implemented on the current branch. It reuses the existing attachment upload endpoint and audio preview, adds no dependency, stops media tracks on stop/cancel/unmount, and has English/Vietnamese UI strings.

## Delivery sequence

### Foundation — current branch

- Record these decisions and acceptance criteria.
- Browser audio recording is complete as a frontend-only extension of task attachments.
- Keep changes small enough to upstream-rebase cleanly.

Verification completed on 2026-09-22:

- Focused Vitest suite: 6 tests passed across `AudioRecorder.test.ts` and `Attachments.test.ts`.
- ESLint: 0 errors; 19 pre-existing warnings elsewhere in the frontend.
- Stylelint: passed.
- Production PWA build: passed and generated the service worker/precache.
- Full `vue-tsc` typecheck: still fails on numerous pre-existing upstream errors. Filtered output contains no error originating in `AudioRecorder.vue` or its test after the compatibility fix.
- Backend tests were not run because Go 1.27 and Mage are not installed in this environment; this foundation change does not modify backend code.

### MVP A — Telegram reminders

- Add opt-in Telegram configuration; never commit the bot token.
- Link a Vikunja user to a Telegram chat through a one-time, expiring verification flow. Do not accept an arbitrary chat ID as proof of ownership.
- Subscribe a Telegram delivery handler to the existing reminder-fired event instead of creating a second scheduler.
- Store delivery attempts and an idempotency key so retries cannot send the same reminder repeatedly.
- Retry transient failures with bounded backoff; expose permanent configuration/delivery errors to the user.
- Escape or strictly format task content sent to Telegram.

### MVP B — online-first offline outbox

- Scope the first offline write path to create/update/complete task operations and the fields agreed for MVP. Queue attachments separately; do not store large recordings indefinitely without an explicit size/quota policy.
- Persist queued operations in IndexedDB, with client-generated operation IDs, creation time, base server revision/time, status, and last error.
- Show offline status and queued/failed operation counts. Let the user retry or discard a failed operation deliberately.
- Flush in creation order when authenticated connectivity returns.
- Treat authentication errors, validation errors, deleted remote records, and edit conflicts differently. Never silently discard queued data.
- Add deterministic unit tests for queue ordering, retry/idempotency, reconnect, and conflicts before broadening offline coverage.

### MVP C — free self-hosting

- Use the existing single-server Vikunja deployment with SQLite for the initial personal instance.
- Provide Docker Compose and backup/restore documentation using user-owned hardware or an actually free host available at deployment time.
- Treat zero cost as a constraint, not an uptime guarantee. Do not claim production reliability without monitoring and backups.

### Phase 2 — Google Calendar

- Design only after the MVP task/reminder flow is stable.
- Resolve directionality, recurrence mapping, deletion semantics, timezone behavior, OAuth credentials, and conflict rules before implementation.
- Preserve Google provider identifiers and sync metadata separately from task content.

## Acceptance criteria

### Browser audio recording

- On a supported secure browser, an editor can start and stop microphone recording from a task's Attachments section.
- Stopping creates an audio `File` and uploads it through the existing attachment service.
- Canceling or leaving the component stops every microphone track and uploads nothing.
- Permission denial and recorder failures show a local, translatable error and do not leave the microphone active.
- Browsers without the required APIs do not show a broken recording control; normal file upload remains available.

### Telegram MVP

- A linked user receives each due reminder at most once under normal retry conditions.
- A bad or missing token does not prevent reminders for other channels from being processed.
- Users can disconnect Telegram and the server stops deliveries to that chat.
- Secrets are environment/config values and never appear in source, logs, screenshots, or fixtures.

### Offline MVP

- Supported edits made offline survive reload and are visibly marked as queued.
- Reconnecting triggers synchronization without requiring a second manual edit.
- A transient network failure keeps the operation queued for retry.
- A permanent validation/auth error is visible and actionable.
- A conflicting remote edit is not silently overwritten.

### Cost and compatibility

- The MVP can run without a paid SaaS dependency.
- Existing online task behavior and existing attachment upload/playback continue to work.
- The application remains usable at a 390 px viewport.

## Engineering rules for the next task

- Read root `AGENTS.md` and relevant files under `.agents/docs/` before editing.
- New API routes must be under `/api/v2`; the frontend must use the generated client.
- Do not hand-edit `pkg/swagger/` or `config.yml.sample`.
- Before schema work, read `.agents/skills/migration/SKILL.md` completely. Before API-v2 work, read `.agents/skills/api-v2-routes/SKILL.md` completely.
- Backend tests run through Mage, not raw `go test`. Save test logs as required by repository instructions.
- Frontend checks: focused `pnpm vitest run <file>`, `pnpm lint:fix`, `pnpm lint:styles:fix`, and `pnpm build`.
- Preserve unrelated upstream/user changes and use Conventional Commits.

## Suggested next-task prompt

> Continue the Personal Task PWA from `PROJECT_HANDOFF.md` on branch `codex/personal-task-pwa`. Read `AGENTS.md` first, inspect the current git status and recent commit, then implement the next unfinished delivery step without changing the locked decisions. Reuse Vikunja's existing architecture. Run the relevant checks and update `PROJECT_HANDOFF.md` with verified progress and any limitations before handing off.
