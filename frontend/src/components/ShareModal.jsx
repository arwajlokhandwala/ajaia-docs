import { useState, useEffect } from 'react';
import { X, UserPlus, UserMinus, Users } from 'lucide-react';
import { api } from '../api/client';

export default function ShareModal({ doc, onClose, onToast, onRefresh }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sharing, setSharing] = useState(null);

  useEffect(() => {
    api.users().then(data => setUsers(data.users)).catch(() => {});
  }, []);

  const sharedIds = new Set((doc.shares || []).map(s => s.id));

  async function handleShare(userId) {
    setSharing(userId);
    try {
      await api.shareDocument(doc.id, userId);
      onToast('Access granted', 'success');
      onRefresh();
    } catch (err) {
      onToast(err.message, 'error');
    } finally {
      setSharing(null);
    }
  }

  async function handleRevoke(userId, name) {
    setSharing(userId);
    try {
      await api.revokeShare(doc.id, userId);
      onToast(`Access revoked for ${name}`);
      onRefresh();
    } catch (err) {
      onToast(err.message, 'error');
    } finally {
      setSharing(null);
    }
  }

  const COLORS = ['#2563eb', '#7c3aed', '#059669', '#d97706', '#dc2626'];
  const colorFor = (name) => COLORS[name.charCodeAt(0) % COLORS.length];

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={18} style={{ color: 'var(--primary)' }} />
            <span className="modal-title">Share document</span>
          </div>
          <button className="modal-close" onClick={onClose}><X size={16} /></button>
        </div>

        {/* Doc info */}
        <div style={{
          padding: '10px 14px', background: 'var(--bg)',
          borderRadius: 'var(--radius-sm)', marginBottom: 16, fontSize: 13,
        }}>
          <span style={{ fontWeight: 600 }}>{doc.title}</span>
          <span style={{ color: 'var(--text-muted)', marginLeft: 8 }}>
            · owned by you
          </span>
        </div>

        {/* Currently shared */}
        {(doc.shares || []).length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Has access
            </p>
            {(doc.shares || []).map(s => (
              <div key={s.id} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 0', borderBottom: '1px solid var(--border-light)',
              }}>
                <Avatar name={s.name} color={colorFor(s.name)} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{s.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.email}</div>
                </div>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => handleRevoke(s.id, s.name)}
                  disabled={sharing === s.id}
                >
                  <UserMinus size={12} />
                  {sharing === s.id ? '…' : 'Revoke'}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add users */}
        <div>
          <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Add people
          </p>
          {users.filter(u => !sharedIds.has(u.id)).length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--text-muted)', padding: '8px 0' }}>
              All users already have access.
            </p>
          ) : (
            users.filter(u => !sharedIds.has(u.id)).map(u => (
              <div key={u.id} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 0', borderBottom: '1px solid var(--border-light)',
              }}>
                <Avatar name={u.name} color={colorFor(u.name)} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{u.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{u.email}</div>
                </div>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => handleShare(u.id)}
                  disabled={sharing === u.id}
                >
                  <UserPlus size={12} />
                  {sharing === u.id ? '…' : 'Share'}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function Avatar({ name, color }) {
  return (
    <div style={{
      width: 34, height: 34, borderRadius: '50%', background: color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'white', fontWeight: 600, fontSize: 13, flexShrink: 0,
    }}>
      {name?.[0]}
    </div>
  );
}
