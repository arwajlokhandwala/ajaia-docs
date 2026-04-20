const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// GET /api/documents
router.get('/', (req, res) => {
  const owned = db.prepare(`
    SELECT d.id, d.title, d.created_at, d.updated_at,
           'owner' as role,
           u.name as owner_name, u.email as owner_email
    FROM documents d
    JOIN users u ON u.id = d.owner_id
    WHERE d.owner_id = ?
    ORDER BY d.updated_at DESC
  `).all(req.user.id);

  const shared = db.prepare(`
    SELECT d.id, d.title, d.created_at, d.updated_at,
           'shared' as role,
           u.name as owner_name, u.email as owner_email
    FROM documents d
    JOIN document_shares ds ON ds.document_id = d.id
    JOIN users u ON u.id = d.owner_id
    WHERE ds.shared_with_id = ?
    ORDER BY d.updated_at DESC
  `).all(req.user.id);

  res.json({ documents: [...owned, ...shared] });
});

// POST /api/documents
router.post('/', (req, res) => {
  const { title = 'Untitled Document', content = '' } = req.body;
  const id = uuidv4();
  db.prepare('INSERT INTO documents (id, title, content, owner_id) VALUES (?, ?, ?, ?)')
    .run(id, title, content, req.user.id);
  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(id);
  res.status(201).json({ document: doc });
});

// GET /api/documents/:id
router.get('/:id', (req, res) => {
  const doc = db.prepare(`
    SELECT d.*, u.name as owner_name, u.email as owner_email
    FROM documents d JOIN users u ON u.id = d.owner_id
    WHERE d.id = ?
  `).get(req.params.id);

  if (!doc) return res.status(404).json({ error: 'Document not found' });

  const isOwner = doc.owner_id === req.user.id;
  const hasShare = db.prepare(
    'SELECT 1 FROM document_shares WHERE document_id = ? AND shared_with_id = ?'
  ).get(req.params.id, req.user.id);

  if (!isOwner && !hasShare) return res.status(403).json({ error: 'Access denied' });

  const shares = db.prepare(`
    SELECT u.id, u.name, u.email FROM document_shares ds
    JOIN users u ON u.id = ds.shared_with_id
    WHERE ds.document_id = ?
  `).all(req.params.id);

  res.json({ document: { ...doc, shares, role: isOwner ? 'owner' : 'shared' } });
});

// PATCH /api/documents/:id
router.patch('/:id', (req, res) => {
  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(req.params.id);
  if (!doc) return res.status(404).json({ error: 'Document not found' });

  const isOwner = doc.owner_id === req.user.id;
  const hasShare = db.prepare(
    'SELECT 1 FROM document_shares WHERE document_id = ? AND shared_with_id = ?'
  ).get(req.params.id, req.user.id);

  if (!isOwner && !hasShare) return res.status(403).json({ error: 'Access denied' });

  const { title, content } = req.body;
  const setClauses = [];
  const vals = [];

  if (title !== undefined)   { setClauses.push('title = ?');   vals.push(title); }
  if (content !== undefined) { setClauses.push('content = ?'); vals.push(content); }
  setClauses.push("updated_at = datetime('now')");

  if (vals.length > 0) {
    vals.push(req.params.id);
    db.prepare(`UPDATE documents SET ${setClauses.join(', ')} WHERE id = ?`).run(...vals);
  }

  const updated = db.prepare('SELECT * FROM documents WHERE id = ?').get(req.params.id);
  res.json({ document: updated });
});

// DELETE /api/documents/:id
router.delete('/:id', (req, res) => {
  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(req.params.id);
  if (!doc) return res.status(404).json({ error: 'Document not found' });
  if (doc.owner_id !== req.user.id) return res.status(403).json({ error: 'Only owner can delete' });
  db.prepare('DELETE FROM documents WHERE id = ?').run(req.params.id);
  res.json({ message: 'Deleted' });
});

// POST /api/documents/:id/share
router.post('/:id/share', (req, res) => {
  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(req.params.id);
  if (!doc) return res.status(404).json({ error: 'Document not found' });
  if (doc.owner_id !== req.user.id) return res.status(403).json({ error: 'Only owner can share' });

  const { user_id } = req.body;
  if (!user_id) return res.status(400).json({ error: 'user_id is required' });
  if (user_id === req.user.id) return res.status(400).json({ error: 'Cannot share with yourself' });

  const target = db.prepare('SELECT id, name, email FROM users WHERE id = ?').get(user_id);
  if (!target) return res.status(404).json({ error: 'User not found' });

  db.prepare(
    'INSERT OR IGNORE INTO document_shares (id, document_id, shared_with_id) VALUES (?, ?, ?)'
  ).run(uuidv4(), req.params.id, user_id);

  res.json({ message: `Shared with ${target.name}`, user: target });
});

// DELETE /api/documents/:id/share/:userId
router.delete('/:id/share/:userId', (req, res) => {
  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(req.params.id);
  if (!doc) return res.status(404).json({ error: 'Document not found' });
  if (doc.owner_id !== req.user.id) return res.status(403).json({ error: 'Only owner can revoke' });

  db.prepare('DELETE FROM document_shares WHERE document_id = ? AND shared_with_id = ?')
    .run(req.params.id, req.params.userId);
  res.json({ message: 'Access revoked' });
});

module.exports = router;
