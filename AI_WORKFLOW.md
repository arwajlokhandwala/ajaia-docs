# AI Workflow Notes

## Tools Used

- **Claude (claude.ai)** — primary tool throughout; used for code generation, debugging, architecture reasoning, and writing
- **No other AI tools** — didn't use Copilot, Cursor, or GPT-4 in this project

---

## Where AI Materially Sped Up the Work

### Boilerplate compression
The biggest time savings came from scaffolding React components that follow a predictable structure. Writing the initial skeleton of `Sidebar.jsx`, `ShareModal.jsx`, and `DocEditor.jsx` would have taken 30–40 minutes of typing muscle memory. AI generated structurally sound first drafts in under a minute each, freeing me to focus on the logic and UX details that actually require judgment.

### TipTap configuration
TipTap's extension system is well-documented but verbose. I described the formatting requirements (bold, italic, underline, H1–H3, bullet list, ordered list, history, placeholder) and got a correct extension array and editor config back immediately. I then adjusted the toolbar button behavior — specifically the `onMouseDown` with `preventDefault` pattern that prevents the editor from losing focus when clicking toolbar buttons. That detail wasn't in the generated output and required me to know it.

### SQLite schema
Given the described sharing model, AI generated a clean normalized schema on the first pass. The `UNIQUE(document_id, shared_with_id)` constraint and `INSERT OR IGNORE` pattern for idempotent sharing were both in the initial output and both correct.

### Markdown → HTML parser
Writing a lightweight inline Markdown-to-HTML converter is tedious but mechanical. AI generated a working line-by-line parser covering headings, bold, italic, inline code, and lists. I reviewed the output, tested it against actual `.md` fixtures, and confirmed it handled edge cases like list flushing correctly.

### Test scaffolding
Given the route structure, AI generated a comprehensive integration test file covering all the access control scenarios I needed (owner access, shared access, denied access, revoke). The test for "Bob can read after share, then cannot read after revoke" in a single `describe` block was generated correctly in one pass.

---

## What AI Got Wrong or Where I Changed the Output

### `better-sqlite3` → `node:sqlite`
The initial DB layer used `better-sqlite3` with named parameters (`@param` style). When native compilation failed in the build environment, I identified the issue and switched to Node 22's built-in `node:sqlite`. AI assisted in the rewrite but the diagnosis and decision were mine — I knew from experience that native modules are the most common friction point in constrained environments.

The `node:sqlite` API uses positional `?` parameters rather than named ones. The migration of every `db.prepare().run({...})` call to `db.prepare().run(...)` was mechanical but required attention to parameter ordering.

### Toolbar focus behavior
The initial `Editor.jsx` toolbar used `onClick` handlers, which caused the editor to lose focus and drop the current selection on every toolbar click. I replaced `onClick` with `onMouseDown` + `e.preventDefault()` — a well-known ProseMirror pattern. This wasn't something AI got wrong exactly; it's a behavioral detail that only manifests at runtime.

### Over-generated complexity in DocEditor
The first draft of `DocEditor.jsx` included a full optimistic update system with rollback on save failure and a `useReducer` for document state. It was correct but over-engineered for the scope. I simplified to direct `useState` and a straightforward save callback — the right call for a timebox where readability matters more than theoretical resilience.

### CSS variable scoping
Initial CSS used hex literals scattered through component styles. I refactored to a CSS custom property system (`--primary`, `--text-muted`, `--border`, etc.) defined in `global.css`. This wasn't an AI error; I added it as a deliberate quality pass because a codebase with consistent design tokens is significantly easier to review.

---

## How I Verified Correctness

**Backend:** Integration tests against an in-memory SQLite database. Every access control scenario — owner, shared user, denied user, revoked access — is covered by an explicit test case. Tests run in ~5 seconds and produce green output I can show.

**Frontend:** Manual smoke testing against the running backend:
- Created documents, verified auto-save and persistence across page refresh
- Renamed a document and confirmed the sidebar updated
- Uploaded `.txt` and `.md` files, inspected the resulting HTML in the editor
- Logged in as Alice, shared a document with Bob, opened incognito, logged in as Bob, verified the document appeared under "Shared with me"
- Revoked Bob's access, refreshed Bob's session, confirmed the document disappeared

**UX quality:** Clicked through every interaction deliberately looking for jarring moments. The main things I caught and fixed: the toolbar focus issue (above), the title edit input not auto-focusing, and the share modal not refreshing after a grant/revoke without a page reload (fixed by chaining `onRefresh` calls).

---

## Overall Assessment

AI removed approximately 2–3 hours of typing work from a 5-hour project. The judgment calls — what to cut, what to prioritize, what the architecture should look like, how to handle the SQLite environment issue — were entirely mine. AI is most useful here as a precision code generator for structures I've already reasoned about, not as a substitute for that reasoning.

The honest failure mode to watch for is over-trusting generated code in the areas where runtime behavior diverges from apparent correctness: focus management, async race conditions, and access control edge cases. All three required hands-on verification.
