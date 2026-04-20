import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Share2, Check, AlertCircle, Users } from 'lucide-react';
import Editor from './Editor';
import ShareModal from './ShareModal';
import { api } from '../api/client';

const SAVE_DEBOUNCE = 1200; // ms after last content change

export default function DocEditor({ onToast, onRefresh }) {
  const { id } = useParams();
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saveState, setSaveState] = useState('saved'); // 'saved' | 'saving' | 'error'
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const [showShare, setShowShare] = useState(false);
  const saveTimer = useRef(null);
  const contentRef = useRef('');

  const loadDoc = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.getDocument(id);
      setDoc(data.document);
      contentRef.current = data.document.content;
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadDoc(); }, [loadDoc]);

  async function handleContentChange(html) {
    if (!doc) return;
    contentRef.current = html;
    setSaveState('saving');
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        await api.updateDocument(id, { content: html });
        setSaveState('saved');
      } catch (err) {
        setSaveState('error');
        onToast('Failed to save', 'error');
      }
    }, SAVE_DEBOUNCE);
  }

  async function handleTitleSave() {
    if (!titleDraft.trim() || titleDraft === doc.title) {
      setEditingTitle(false);
      return;
    }
    try {
      const data = await api.updateDocument(id, { title: titleDraft.trim() });
      setDoc(d => ({ ...d, title: data.document.title }));
      onRefresh();
      onToast('Renamed', 'success');
    } catch (err) {
      onToast(err.message, 'error');
    } finally {
      setEditingTitle(false);
    }
  }

  function startEditTitle() {
    if (doc?.role !== 'owner') return;
    setTitleDraft(doc.title);
    setEditingTitle(true);
  }

  if (!id) {
    return (
      <EmptyState />
    );
  }

  if (loading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>⌛</div>
          Loading document…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          <AlertCircle size={32} style={{ marginBottom: 12, color: 'var(--danger)' }} />
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Couldn't load document</div>
          <div style={{ fontSize: 13 }}>{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--surface)' }}>
      {/* Doc header */}
      <div style={{
        height: 'var(--topbar-height)',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center',
        padding: '0 24px', gap: 12, flexShrink: 0,
      }}>
        {/* Title */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          {editingTitle ? (
            <input
              autoFocus
              value={titleDraft}
              onChange={e => setTitleDraft(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={e => {
                if (e.key === 'Enter') handleTitleSave();
                if (e.key === 'Escape') setEditingTitle(false);
              }}
              style={{
                border: 'none', borderBottom: '2px solid var(--primary)',
                background: 'transparent', fontSize: 16, fontWeight: 600,
                outline: 'none', width: '100%', padding: '2px 0',
              }}
            />
          ) : (
            <h1
              onClick={startEditTitle}
              title={doc?.role === 'owner' ? 'Click to rename' : ''}
              style={{
                fontSize: 16, fontWeight: 600,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                cursor: doc?.role === 'owner' ? 'text' : 'default',
                padding: '2px 0',
              }}
            >
              {doc?.title}
            </h1>
          )}
        </div>

        {/* Metadata */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          {/* Role badge */}
          {doc?.role === 'shared' && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '3px 10px', borderRadius: 20,
              background: '#f3e8ff', color: '#7c3aed',
              fontSize: 12, fontWeight: 500,
            }}>
              <Users size={11} />
              Shared by {doc.owner_name}
            </div>
          )}

          {/* Save state */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-muted)' }}>
            {saveState === 'saving' && <span>Saving…</span>}
            {saveState === 'saved' && (
              <>
                <Check size={12} style={{ color: 'var(--success)' }} />
                <span>Saved</span>
              </>
            )}
            {saveState === 'error' && (
              <>
                <AlertCircle size={12} style={{ color: 'var(--danger)' }} />
                <span style={{ color: 'var(--danger)' }}>Error saving</span>
              </>
            )}
          </div>

          {/* Share button (owner only) */}
          {doc?.role === 'owner' && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setShowShare(true)}
            >
              <Share2 size={13} />
              Share
              {doc?.shares?.length > 0 && (
                <span style={{
                  background: 'var(--primary)', color: 'white',
                  borderRadius: 10, padding: '1px 6px', fontSize: 11, fontWeight: 600,
                }}>
                  {doc.shares.length}
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Editor area */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <Editor
          content={doc?.content}
          onChange={handleContentChange}
          readOnly={false}
        />
      </div>

      {/* Share modal */}
      {showShare && doc && (
        <ShareModal
          doc={doc}
          onClose={() => setShowShare(false)}
          onToast={onToast}
          onRefresh={() => { loadDoc(); onRefresh(); }}
        />
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div style={{
      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)',
    }}>
      <div style={{ textAlign: 'center', color: 'var(--text-muted)', maxWidth: 320 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📄</div>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: 'var(--text)' }}>
          Select a document
        </h2>
        <p style={{ fontSize: 14 }}>
          Choose a document from the sidebar, or create a new one to get started.
        </p>
      </div>
    </div>
  );
}
