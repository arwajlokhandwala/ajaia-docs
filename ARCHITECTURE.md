# Architecture Notes

## What I Prioritized and Why

### Core thesis
With a 4–6 hour timebox on a full-stack collaborative editor, the highest-value bets are: (1) an editing experience that actually feels good, (2) sharing logic that's coherent and demonstrable, and (3) a clean, reviewable codebase. I deliberately under-built infrastructure to protect depth in those three areas.

---

## Stack Decisions

### Editor: TipTap (ProseMirror)
TipTap is headless, composable, and ProseMirror-based. It gives production-quality editing behavior — selection, undo/redo, keyboard shortcuts — without fighting the browser. Quill and Draft.js both carry significant historical baggage. The TipTap extension model meant I could add exactly the formatting needed (Bold, Italic, Underline, Headings, Lists, History) and nothing else.

Auto-save is debounced at 600ms after the editor's `onUpdate` fires. This means rapid typing doesn't flood the API, while edits are persisted within a second of the user pausing.

### Database: Node 22 built-in `node:sqlite`
The first instinct was `better-sqlite3`, which has an excellent synchronous API. But it requires native compilation against Node headers, which fails in environments without build toolchain access. Node 22.5+ ships SQLite as a built-in experimental module with a nearly identical synchronous API. Zero installation friction, no external binary, same relational model.

For production I'd swap to `better-sqlite3` once the target platform is confirmed, or use Postgres via `pg` if horizontal scaling is needed. The schema is standard SQL — the migration is mechanical.

### Auth: JWT + seeded users
Real auth (OAuth, magic links, registration flow) would consume ~2 hours of the timebox. Seeded accounts with password login get reviewers into the sharing demo in 10 seconds. The JWT middleware is production-ready — it would just need real user management wired in front of it.

### API design
REST with standard HTTP semantics. Documents use `PATCH` for partial updates (title-only or content-only) rather than PUT, which matters for the title rename flow — you shouldn't have to send the full document HTML just to rename it.

The sharing model is intentional: a `document_shares` join table with `(document_id, shared_with_id)` unique constraint. `INSERT OR IGNORE` makes the share endpoint idempotent. Revoke is a delete on that row.

---

## What I Cut and Why

| Feature | Reason |
|---------|--------|
| Real-time collaboration (WebSockets/CRDT) | Would require Yjs or Automerge + socket infrastructure; adds 6+ hours for a feature that can be communicated in words |
| DOCX import | `mammoth.js` works but adds binary parsing complexity; `.md` and `.txt` demonstrate the same product judgment more cleanly |
| Role-based access (viewer vs. editor) | Current model lets shared users edit, which is the collaborative intent. A viewer/editor distinction is a one-field addition to `document_shares` |
| User registration | Out of scope for a timebox; seeded accounts serve the evaluation purpose |
| Full-text search | Straightforward SQLite FTS5 addition but not core to this slice |
| Pagination | Documents list is unbounded; for production, cursor-based pagination on the list endpoint |

---

## What I'd Build Next (2–4 more hours)

1. **Viewer/editor roles** — add a `role` column to `document_shares`, expose it in the share modal, enforce it in the PATCH handler. The data model already supports it.

2. **DOCX import** — `mammoth.js` converts `.docx` to clean HTML that TipTap can accept directly. One additional multer filter and a `mammoth.convertToHtml()` call.

3. **Conflict-free autosave** — the current debounce works for single-user edits but would race in true multi-user scenarios. Adding a `version` column and optimistic locking would make concurrent edits safe before introducing WebSocket-based real-time sync.

4. **Deployment pipeline** — Dockerfile for the backend, Vercel or Cloudflare Pages for the static frontend, `DATABASE_URL` environment variable pointing to Turso (LibSQL hosted SQLite) or Postgres. The schema is already migration-ready.

5. **Error boundaries** — wrap the editor and document views in React error boundaries so a malformed document content string doesn't crash the whole UI.

---

## Data Model

```sql
users (
  id           TEXT PRIMARY KEY,   -- 'user-alice', etc.
  email        TEXT UNIQUE,
  name         TEXT,
  password_hash TEXT,
  created_at   TEXT
)

documents (
  id         TEXT PRIMARY KEY,     -- UUIDv4
  title      TEXT,
  content    TEXT,                 -- TipTap HTML
  owner_id   TEXT → users.id,
  created_at TEXT,
  updated_at TEXT
)

document_shares (
  id              TEXT PRIMARY KEY,
  document_id     TEXT → documents.id,
  shared_with_id  TEXT → users.id,
  created_at      TEXT,
  UNIQUE(document_id, shared_with_id)
)
```

Content is stored as TipTap-compatible HTML. This is pragmatic for the scope — a production system might store ProseMirror JSON (more stable for programmatic manipulation) or a CRDT state, but HTML round-trips perfectly through TipTap and is human-readable in the database.

---

## Security Notes (Production Gaps)

- JWT secret must be set via environment variable before production deploy
- No rate limiting on login endpoint (add `express-rate-limit` before shipping)
- `node:sqlite` is marked experimental; swap to `better-sqlite3` for production
- CORS origin is locked to the configured frontend URL
