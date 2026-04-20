import { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import DocEditor from './components/DocEditor';
import { api } from './api/client';

// ─── Toast system ────────────────────────────────────────────────────────────
function ToastContainer({ toasts }) {
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type || ''}`}>
          {t.message}
        </div>
      ))}
    </div>
  );
}

function useToast() {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = '') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 2800);
  }, []);

  return { toasts, addToast };
}

// ─── Protected layout ────────────────────────────────────────────────────────
function AppLayout() {
  const { user, loading } = useAuth();
  const [documents, setDocuments] = useState([]);
  const { toasts, addToast } = useToast();

  const loadDocuments = useCallback(async () => {
    if (!user) return;
    try {
      const data = await api.listDocuments();
      setDocuments(data.documents);
    } catch (err) {
      addToast('Failed to load documents', 'error');
    }
  }, [user]);

  useEffect(() => { loadDocuments(); }, [loadDocuments]);

  if (loading) {
    return (
      <div style={{
        height: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', color: 'var(--text-muted)',
      }}>
        Loading…
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar
        documents={documents}
        onRefresh={loadDocuments}
        onToast={addToast}
      />
      <main style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <Routes>
          <Route index element={<DocEditor onToast={addToast} onRefresh={loadDocuments} />} />
          <Route path="doc/:id" element={<DocEditor onToast={addToast} onRefresh={loadDocuments} />} />
        </Routes>
      </main>
      <ToastContainer toasts={toasts} />
    </div>
  );
}

// ─── Root ────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/*" element={<AppLayout />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

function LoginPage() {
  const { user } = useAuth();
  if (user) return <Navigate to="/" replace />;
  return <Login />;
}
