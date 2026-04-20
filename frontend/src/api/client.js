const BASE = '/api';

function getToken() {
  return localStorage.getItem('token');
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/login';
    return;
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  // Auth
  login: (email, password) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  me: () => request('/auth/me'),
  users: () => request('/auth/users'),

  // Documents
  listDocuments: () => request('/documents'),
  getDocument: (id) => request(`/documents/${id}`),
  createDocument: (data) =>
    request('/documents', { method: 'POST', body: JSON.stringify(data) }),
  updateDocument: (id, data) =>
    request(`/documents/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteDocument: (id) =>
    request(`/documents/${id}`, { method: 'DELETE' }),

  // Sharing
  shareDocument: (id, userId) =>
    request(`/documents/${id}/share`, {
      method: 'POST',
      body: JSON.stringify({ user_id: userId }),
    }),
  revokeShare: (id, userId) =>
    request(`/documents/${id}/share/${userId}`, { method: 'DELETE' }),

  // Upload
  uploadFile: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const token = getToken();
    return fetch(`${BASE}/upload`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    }).then(async (res) => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      return data;
    });
  },
};
