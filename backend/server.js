const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const isProd = process.env.NODE_ENV === 'production';

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth',      require('./routes/auth'));
app.use('/api/documents', require('./routes/documents'));
app.use('/api/upload',    require('./routes/upload'));

app.get('/api/health', (req, res) =>
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
);

// Serve built frontend in production
if (isProd) {
  const distPath = path.join(__dirname, '../frontend/dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
}

// Error handler
app.use((err, req, res, next) => {
  if (err.name === 'MulterError' || err.message?.includes('Only')) {
    return res.status(400).json({ error: err.message });
  }
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

if (require.main === module) {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => console.log(`Ajaia Docs API → http://localhost:${PORT}`));
}

module.exports = app;
