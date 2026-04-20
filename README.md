# Ajaia Docs

A lightweight collaborative document editor. Create, edit, share, and import documents in a browser-based rich-text environment.

**Live demo:** `https://ajaia-docs.up.railway.app` *(see deployment note below)*

---

## Test Accounts

Three seeded users are available immediately — no signup needed:

| Name | Email | Password |
|------|-------|----------|
| Alice Chen | alice@ajaia.com | password123 |
| Bob Torres | bob@ajaia.com | password123 |
| Carol Smith | carol@ajaia.com | password123 |

**To test sharing:** log in as Alice, create a document, click **Share**, and grant Bob access. Then open a new browser tab or incognito window, log in as Bob, and verify the document appears under "Shared with me."

---

## Local Setup

### Prerequisites

- Node.js **22.5+** (required for built-in `node:sqlite`)
- npm 9+

```bash
node --version   # must be >= 22.5
```

### 1. Clone & install

```bash
git clone <repo-url> ajaia-docs
cd ajaia-docs

npm install --prefix backend
npm install --prefix frontend
```

### 2. Run backend

```bash
cd backend
npm start
# → API running at http://localhost:3001
```

The SQLite database file (`ajaia.db`) is created automatically on first run. Three seed users are inserted if not already present.

### 3. Run frontend

In a second terminal:

```bash
cd frontend
npm run dev
# → UI at http://localhost:5173
```

The Vite dev server proxies `/api/*` to `localhost:3001` — no environment variables needed for local development.

### 4. Run tests

```bash
cd backend
npm test
# 16 tests across auth, documents, sharing, and file upload
# Uses an in-memory DB — no file created
```

---

## Feature Overview

### Document editing
- Rich-text editor (TipTap/ProseMirror) with bold, italic, underline, H1–H3, bullet and numbered lists
- Auto-save on a 600ms debounce — "Saved" / "Saving…" indicator in header
- Click the document title to rename inline (owner only)

### File import
Drag-and-drop or click "Import File" in the sidebar. Supported types:
- `.txt` — plain text, paragraphs preserved
- `.md` — Markdown converted to rich HTML (headings, bold, italic, lists)

Imported files become new editable documents. `.docx`, `.pdf`, and other types are explicitly rejected with a clear error message.

### Sharing
- Owner can open the **Share** modal from any document header
- Grant access to any other user with one click
- Revoke access at any time
- Owned documents appear under **My Documents** in the sidebar
- Documents shared with you appear under **Shared with me** with a share icon
- Non-owners see who owns the document in the header badge

### Persistence
- SQLite database via Node 22's built-in `node:sqlite`
- All documents, users, and share records persist across restarts
- Rich-text HTML content is stored and restored exactly

---

## Project Structure

```
ajaia-docs/
├── backend/
│   ├── db.js                  # SQLite schema + seeded users
│   ├── server.js              # Express app
│   ├── middleware/auth.js     # JWT verify
│   ├── routes/
│   │   ├── auth.js            # Login, /me, user list
│   │   ├── documents.js       # CRUD + share/revoke
│   │   └── upload.js          # File import
│   └── server.test.js         # 16 integration tests
├── frontend/
│   └── src/
│       ├── api/client.js      # Typed API wrapper
│       ├── hooks/useAuth.jsx  # Auth context
│       ├── components/
│       │   ├── Login.jsx
│       │   ├── Sidebar.jsx
│       │   ├── Editor.jsx     # TipTap editor + toolbar
│       │   ├── DocEditor.jsx  # Document page
│       │   └── ShareModal.jsx
│       └── styles/global.css
├── README.md
├── ARCHITECTURE.md
├── AI_WORKFLOW.md
└── SUBMISSION.md
```

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | API server port |
| `JWT_SECRET` | `ajaia-dev-secret-change-in-prod` | Change in production |
| `DB_PATH` | `./ajaia.db` | SQLite file path (`:memory:` for tests) |
| `CORS_ORIGIN` | `http://localhost:5173` | Allowed frontend origin |

---

## Deployment (Railway)

```bash
# Install Railway CLI
npm install -g @railway/cli
railway login

# From project root
railway init
railway up
```

The `railway.toml` config is included. Set `CORS_ORIGIN` to your frontend URL and `JWT_SECRET` to a secure random string in the Railway dashboard.

For a static frontend deployment (e.g. Vercel), run `npm run build --prefix frontend` and set `VITE_API_URL` to the Railway backend URL, then update `api/client.js` accordingly.
