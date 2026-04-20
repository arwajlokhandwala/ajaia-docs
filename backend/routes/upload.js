const express = require('express');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

const ALLOWED_EXTS = ['.txt', '.md'];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    ALLOWED_EXTS.includes(ext)
      ? cb(null, true)
      : cb(new Error(`Only ${ALLOWED_EXTS.join(', ')} files are supported`));
  },
});

router.post('/', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const ext = path.extname(req.file.originalname).toLowerCase();
  const raw = req.file.buffer.toString('utf-8');
  const baseName = path.basename(req.file.originalname, ext).replace(/[-_]/g, ' ');
  const title = baseName.charAt(0).toUpperCase() + baseName.slice(1);
  const content = ext === '.md' ? markdownToHtml(raw) : txtToHtml(raw);

  const id = uuidv4();
  db.prepare('INSERT INTO documents (id, title, content, owner_id) VALUES (?, ?, ?, ?)')
    .run(id, title, content, req.user.id);

  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(id);
  res.status(201).json({ document: doc });
});

function txtToHtml(text) {
  const html = text.split(/\n{2,}/)
    .map(p => p.trim()).filter(Boolean)
    .map(p => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`)
    .join('');
  return html || '<p></p>';
}

function markdownToHtml(md) {
  const lines = md.split('\n');
  const out = [];
  let listType = null;

  const flush = () => { if (listType) { out.push(`</${listType}>`); listType = null; } };
  const inl = t => esc(t)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/__(.+?)__/g, '<strong>$1</strong>')
    .replace(/_(.+?)_/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>');

  for (const line of lines) {
    const h1 = line.match(/^# (.+)/);
    const h2 = line.match(/^## (.+)/);
    const h3 = line.match(/^### (.+)/);
    const ul = line.match(/^[*\-] (.+)/);
    const ol = line.match(/^\d+\. (.+)/);

    if (h1)            { flush(); out.push(`<h1>${inl(h1[1])}</h1>`); }
    else if (h2)       { flush(); out.push(`<h2>${inl(h2[1])}</h2>`); }
    else if (h3)       { flush(); out.push(`<h3>${inl(h3[1])}</h3>`); }
    else if (ul)       { if (listType !== 'ul') { flush(); out.push('<ul>'); listType = 'ul'; } out.push(`<li>${inl(ul[1])}</li>`); }
    else if (ol)       { if (listType !== 'ol') { flush(); out.push('<ol>'); listType = 'ol'; } out.push(`<li>${inl(ol[1])}</li>`); }
    else if (!line.trim()) { flush(); }
    else               { flush(); out.push(`<p>${inl(line)}</p>`); }
  }
  flush();
  return out.join('') || '<p></p>';
}

function esc(t) {
  return t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

module.exports = router;
