// node:sqlite is experimental — suppress the warning in tests
process.env.NODE_NO_WARNINGS = '1';
process.env.DB_PATH = ':memory:';
process.env.JWT_SECRET = 'test-secret';

const request = require('supertest');
const app = require('./server');

let aliceToken, bobToken, docId;

beforeAll(async () => {
  const a = await request(app).post('/api/auth/login').send({ email: 'alice@ajaia.com', password: 'password123' });
  aliceToken = a.body.token;

  const b = await request(app).post('/api/auth/login').send({ email: 'bob@ajaia.com', password: 'password123' });
  bobToken = b.body.token;
});

describe('Health', () => {
  it('returns ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

describe('Auth', () => {
  it('logs in successfully', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'alice@ajaia.com', password: 'password123' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.name).toBe('Alice Chen');
  });

  it('rejects wrong password', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'alice@ajaia.com', password: 'wrong' });
    expect(res.status).toBe(401);
  });

  it('rejects request without token', async () => {
    const res = await request(app).get('/api/documents');
    expect(res.status).toBe(401);
  });

  it('returns current user on /me', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${aliceToken}`);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('alice@ajaia.com');
  });
});

describe('Documents', () => {
  it('creates a document', async () => {
    const res = await request(app)
      .post('/api/documents')
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({ title: 'My Doc', content: '<p>Hello</p>' });
    expect(res.status).toBe(201);
    expect(res.body.document.title).toBe('My Doc');
    docId = res.body.document.id;
  });

  it('lists owned documents with role=owner', async () => {
    const res = await request(app).get('/api/documents').set('Authorization', `Bearer ${aliceToken}`);
    expect(res.status).toBe(200);
    const doc = res.body.documents.find(d => d.id === docId);
    expect(doc).toBeDefined();
    expect(doc.role).toBe('owner');
  });

  it('renames a document', async () => {
    const res = await request(app)
      .patch(`/api/documents/${docId}`)
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({ title: 'Renamed Doc' });
    expect(res.status).toBe(200);
    expect(res.body.document.title).toBe('Renamed Doc');
  });

  it('blocks access from user with no share', async () => {
    const res = await request(app).get(`/api/documents/${docId}`).set('Authorization', `Bearer ${bobToken}`);
    expect(res.status).toBe(403);
  });
});

describe('Sharing', () => {
  it('shares doc with Bob', async () => {
    const res = await request(app)
      .post(`/api/documents/${docId}/share`)
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({ user_id: 'user-bob' });
    expect(res.status).toBe(200);
    expect(res.body.message).toContain('Bob');
  });

  it('Bob can read the shared doc with role=shared', async () => {
    const res = await request(app).get(`/api/documents/${docId}`).set('Authorization', `Bearer ${bobToken}`);
    expect(res.status).toBe(200);
    expect(res.body.document.role).toBe('shared');
  });

  it('shared doc appears in Bob\'s document list', async () => {
    const res = await request(app).get('/api/documents').set('Authorization', `Bearer ${bobToken}`);
    const shared = res.body.documents.find(d => d.id === docId);
    expect(shared).toBeDefined();
    expect(shared.role).toBe('shared');
  });

  it('revokes Bob\'s access', async () => {
    await request(app)
      .delete(`/api/documents/${docId}/share/user-bob`)
      .set('Authorization', `Bearer ${aliceToken}`);
    const res = await request(app).get(`/api/documents/${docId}`).set('Authorization', `Bearer ${bobToken}`);
    expect(res.status).toBe(403);
  });
});

describe('File Upload', () => {
  it('imports a .txt file as a new document', async () => {
    const res = await request(app)
      .post('/api/upload')
      .set('Authorization', `Bearer ${aliceToken}`)
      .attach('file', Buffer.from('Hello world\n\nSecond paragraph'), 'my_notes.txt');
    expect(res.status).toBe(201);
    expect(res.body.document.title).toBe('My notes');
    expect(res.body.document.content).toContain('<p>');
  });

  it('imports a .md file with formatting', async () => {
    const md = '# Title\n\nSome **bold** text\n\n- item one\n- item two';
    const res = await request(app)
      .post('/api/upload')
      .set('Authorization', `Bearer ${aliceToken}`)
      .attach('file', Buffer.from(md), 'readme.md');
    expect(res.status).toBe(201);
    expect(res.body.document.content).toContain('<h1>');
    expect(res.body.document.content).toContain('<strong>');
    expect(res.body.document.content).toContain('<ul>');
  });

  it('rejects unsupported file types', async () => {
    const res = await request(app)
      .post('/api/upload')
      .set('Authorization', `Bearer ${aliceToken}`)
      .attach('file', Buffer.from('%PDF-1.4'), 'file.pdf');
    expect(res.status).toBe(400);
  });
});
