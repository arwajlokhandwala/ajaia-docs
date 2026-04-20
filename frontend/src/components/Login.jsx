import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { FileText } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const DEMO_ACCOUNTS = [
    { name: 'Alice Chen', email: 'alice@ajaia.com', password: 'password123', color: '#2563eb' },
    { name: 'Bob Torres', email: 'bob@ajaia.com', password: 'password123', color: '#7c3aed' },
    { name: 'Carol Smith', email: 'carol@ajaia.com', password: 'password123', color: '#059669' },
  ];

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function quickLogin(account) {
    setLoading(true);
    setError('');
    try {
      await login(account.email, account.password);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: 'var(--bg)', padding: '24px',
    }}>
      <div style={{
        background: 'var(--surface)', borderRadius: '12px',
        boxShadow: 'var(--shadow)', padding: '40px',
        width: '100%', maxWidth: '420px',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 56, height: 56, borderRadius: '12px',
            background: 'var(--primary)', marginBottom: 12,
          }}>
            <FileText size={28} color="white" />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>Ajaia Docs</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 4, fontSize: 13 }}>
            Collaborative document editing
          </p>
        </div>

        {/* Demo accounts */}
        <div style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10, fontWeight: 500 }}>
            DEMO ACCOUNTS — click to sign in
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {DEMO_ACCOUNTS.map(a => (
              <button
                key={a.email}
                onClick={() => quickLogin(a)}
                disabled={loading}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 14px', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)', background: 'var(--surface)',
                  cursor: 'pointer', transition: 'all 0.15s',
                  textAlign: 'left', width: '100%',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--surface)'}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: a.color, display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontWeight: 600, fontSize: 13, flexShrink: 0,
                }}>
                  {a.name[0]}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{a.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{a.email}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>or sign in manually</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
              Email
            </label>
            <input
              className="input"
              type="email"
              placeholder="alice@ajaia.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
              Password
            </label>
            <input
              className="input"
              type="password"
              placeholder="password123"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          {error && (
            <div style={{
              padding: '8px 12px', background: 'var(--danger-light)',
              border: '1px solid #fca5a5', borderRadius: 'var(--radius-sm)',
              color: 'var(--danger)', fontSize: 13,
            }}>
              {error}
            </div>
          )}
          <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
