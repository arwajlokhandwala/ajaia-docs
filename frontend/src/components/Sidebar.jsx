import { useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  FilePlus, Upload, FileText, Share2, LogOut,
  Trash2, ChevronDown, ChevronRight, Users
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../hooks/useAuth';

export default function Sidebar({ documents, onRefresh, onToast }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { id: activeId } = useParams();
  const fileRef = useRef();
  const [uploading, setUploading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [ownedOpen, setOwnedOpen] = useState(true);
  const [sharedOpen, setSharedOpen] = useState(true);

  const owned = documents.filter(d => d.role === 'owner');
  const shared = documents.filter(d => d.role === 'shared');

  async function handleCreate() {
    setCreating(true);
    try {
      const data = await api.createDocument({ title: 'Untitled Document', content: '<p></p>' });
      onRefresh();
      navigate(`/doc/${data.document.id}`);
    } catch (err) {
      onToast(err.message, 'error');
    } finally {
      setCreating(false);
    }
  }

  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const data = await api.uploadFile(file);
      onRefresh();
      navigate(`/doc/${data.document.id}`);
      onToast(`"${data.document.title}" imported`, 'success');
    } catch (err) {
      onToast(err.message, 'error');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  async function handleDelete(e, docId) {
    e.stopPropagation();
    if (!confirm('Delete this document? This cannot be undone.')) return;
    try {
      await api.deleteDocument(docId);
      onRefresh();
      if (activeId === docId) navigate('/');
      onToast('Document deleted');
    } catch (err) {
      onToast(err.message, 'error');
    }
  }

  const avatarColor = ['#2563eb', '#7c3aed', '#059669'][
    (user?.name?.charCodeAt(0) ?? 0) % 3
  ];

  return (
    <aside style={{
      width: 'var(--sidebar-width)', minWidth: 'var(--sidebar-width)',
      background: 'var(--surface)', borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column', height: '100%',
      overflow: 'hidden',
    }}>
      {/* Logo */}
      <div style={{
        padding: '14px 16px', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: 'var(--primary)', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <FileText size={16} color="white" />
        </div>
        <span style={{ fontWeight: 700, fontSize: 15 }}>Ajaia Docs</span>
      </div>

      {/* Actions */}
      <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <button
          className="btn btn-primary"
          style={{ width: '100%', justifyContent: 'center' }}
          onClick={handleCreate}
          disabled={creating}
        >
          <FilePlus size={15} />
          {creating ? 'Creating…' : 'New Document'}
        </button>
        <button
          className="btn btn-ghost"
          style={{ width: '100%', justifyContent: 'center' }}
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
        >
          <Upload size={15} />
          {uploading ? 'Importing…' : 'Import File'}
        </button>
        <input
          ref={fileRef} type="file" accept=".txt,.md"
          style={{ display: 'none' }} onChange={handleUpload}
        />
        <p style={{ fontSize: 11, color: 'var(--text-light)', textAlign: 'center', marginTop: 2 }}>
          Supports .txt and .md files
        </p>
      </div>

      {/* Document list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
        {/* Owned */}
        <SectionHeader
          icon={<FileText size={13} />}
          label="My Documents"
          count={owned.length}
          open={ownedOpen}
          toggle={() => setOwnedOpen(o => !o)}
        />
        {ownedOpen && owned.map(doc => (
          <DocItem
            key={doc.id}
            doc={doc}
            active={doc.id === activeId}
            onOpen={() => navigate(`/doc/${doc.id}`)}
            onDelete={handleDelete}
            showDelete
          />
        ))}
        {ownedOpen && owned.length === 0 && (
          <p style={{ fontSize: 12, color: 'var(--text-light)', padding: '6px 20px' }}>
            No documents yet
          </p>
        )}

        {/* Shared */}
        <SectionHeader
          icon={<Users size={13} />}
          label="Shared with me"
          count={shared.length}
          open={sharedOpen}
          toggle={() => setSharedOpen(o => !o)}
          style={{ marginTop: 8 }}
        />
        {sharedOpen && shared.map(doc => (
          <DocItem
            key={doc.id}
            doc={doc}
            active={doc.id === activeId}
            onOpen={() => navigate(`/doc/${doc.id}`)}
          />
        ))}
        {sharedOpen && shared.length === 0 && (
          <p style={{ fontSize: 12, color: 'var(--text-light)', padding: '6px 20px' }}>
            Nothing shared with you
          </p>
        )}
      </div>

      {/* User footer */}
      <div style={{
        padding: '12px 14px', borderTop: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{
          width: 30, height: 30, borderRadius: '50%',
          background: avatarColor, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', fontWeight: 600, fontSize: 12,
        }}>
          {user?.name?.[0]}
        </div>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <div style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.name}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.email}
          </div>
        </div>
        <button
          onClick={logout}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-muted)', padding: 4, borderRadius: 4,
            display: 'flex', alignItems: 'center',
          }}
          title="Sign out"
        >
          <LogOut size={15} />
        </button>
      </div>
    </aside>
  );
}

function SectionHeader({ icon, label, count, open, toggle, style }) {
  return (
    <button
      onClick={toggle}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '6px 14px', width: '100%',
        background: 'none', border: 'none', cursor: 'pointer',
        color: 'var(--text-muted)', fontSize: 11, fontWeight: 600,
        letterSpacing: '0.04em', textTransform: 'uppercase',
        ...style,
      }}
    >
      {open ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
      {icon}
      {label}
      {count > 0 && (
        <span style={{
          marginLeft: 'auto', background: 'var(--border)',
          borderRadius: 10, padding: '1px 7px', fontSize: 11, fontWeight: 600,
        }}>
          {count}
        </span>
      )}
    </button>
  );
}

function DocItem({ doc, active, onOpen, onDelete, showDelete }) {
  const [hover, setHover] = useState(false);

  return (
    <div
      onClick={onOpen}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '7px 14px', cursor: 'pointer', borderRadius: 6,
        margin: '1px 6px',
        background: active ? 'var(--primary-light)' : hover ? 'var(--bg)' : 'transparent',
        color: active ? 'var(--primary)' : 'var(--text)',
        transition: 'background 0.1s',
      }}
    >
      <FileText size={13} style={{ flexShrink: 0, opacity: 0.7 }} />
      <span style={{
        flex: 1, fontSize: 13, overflow: 'hidden',
        textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {doc.title}
      </span>
      {doc.role === 'shared' && (
        <Share2 size={11} style={{ flexShrink: 0, opacity: 0.5 }} title="Shared with you" />
      )}
      {showDelete && hover && (
        <button
          onClick={(e) => onDelete(e, doc.id)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-muted)', padding: 2, borderRadius: 3,
            display: 'flex', alignItems: 'center', flexShrink: 0,
          }}
          title="Delete"
        >
          <Trash2 size={12} />
        </button>
      )}
    </div>
  );
}
