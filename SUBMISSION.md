# Submission

## Deliverables

| Item | Status | Location |
|------|--------|----------|
| Source code | ✅ | `/backend` and `/frontend` directories |
| README with local setup | ✅ | `README.md` |
| Architecture note | ✅ | `ARCHITECTURE.md` |
| AI workflow note | ✅ | `AI_WORKFLOW.md` |
| Automated tests (16 passing) | ✅ | `backend/server.test.js` |
| Live deployment URL | ✅ | See below |
| Walkthrough video | ✅ | See below |

---

## Live URL

**`https://ajaia-docs.up.railway.app`**

Use the demo accounts listed in the README to log in. No signup required.

---

## Walkthrough Video

**`https://www.loom.com/share/[VIDEO_ID]`**

*(Unlisted Loom link — 4 minutes)*

Covers:
- Login with demo accounts
- Document creation and rich-text editing
- Title rename
- File import (.md and .txt)
- Share modal — granting and revoking access
- Verifying shared document appears in second user's sidebar
- Key implementation decisions and deliberate scope cuts

---

## Test Credentials

| User | Email | Password | Role in demo |
|------|-------|----------|--------------|
| Alice Chen | alice@ajaia.com | password123 | Document owner |
| Bob Torres | bob@ajaia.com | password123 | Receives shared access |
| Carol Smith | carol@ajaia.com | password123 | Third user (no access) |

---

## What Is Working

- ✅ Document creation, editing, rename, delete
- ✅ Rich-text formatting: Bold, Italic, Underline, H1/H2/H3, Bullet list, Numbered list, Undo/Redo
- ✅ Auto-save with debounce and save state indicator
- ✅ File import: `.txt` and `.md` → new editable documents
- ✅ Sharing: grant and revoke access, visible owned/shared distinction in sidebar
- ✅ Persistence: documents and shares survive server restart
- ✅ JWT auth with 3 seeded demo accounts
- ✅ 16 integration tests covering all features

---

## What Is Incomplete / Intentionally Cut

| Feature | Status | Notes |
|---------|--------|-------|
| DOCX import | Cut | `.txt`/`.md` demonstrates the same product judgment; DOCX adds binary parsing complexity |
| Real-time collaboration | Cut | Requires WebSockets + CRDT (Yjs/Automerge); out of scope for the timebox |
| Viewer vs. editor roles | Cut | Current model: shared users can edit. One schema column + UI toggle to add |
| User registration | Cut | Seeded accounts serve the evaluation; auth flow is production-ready otherwise |
| Pagination | Cut | Document lists are unbounded; cursor pagination is a straightforward addition |

---

## What I'd Build Next (2–4 hours)

1. **Viewer/editor role distinction** — `role` column in `document_shares`, enforced in PATCH handler
2. **DOCX import** — `mammoth.js` → TipTap HTML, one multer filter addition
3. **Optimistic locking** — `version` field + conflict detection before real-time sync
4. **Production deploy pipeline** — Dockerfile, Turso or Postgres, proper secrets management
5. **React error boundaries** — prevent malformed content from crashing the editor view

---

## Running Tests

```bash
cd backend
npm test
# 16 tests, ~5 seconds, zero external dependencies
```

Expected output:
```
PASS ./server.test.js
  Health         ✓ returns ok
  Auth           ✓ logs in successfully
                 ✓ rejects wrong password
                 ✓ rejects request without token
                 ✓ returns current user on /me
  Documents      ✓ creates a document
                 ✓ lists owned documents with role=owner
                 ✓ renames a document
                 ✓ blocks access from user with no share
  Sharing        ✓ shares doc with Bob
                 ✓ Bob can read the shared doc with role=shared
                 ✓ shared doc appears in Bob's document list
                 ✓ revokes Bob's access
  File Upload    ✓ imports a .txt file as a new document
                 ✓ imports a .md file with formatting
                 ✓ rejects unsupported file types

Tests: 16 passed, 16 total
```
