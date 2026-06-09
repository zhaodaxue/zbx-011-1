import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

import { initDatabase } from './db';
import { insertSampleData } from './sampleData';
import treesRouter from './routes/trees';
import observationsRouter from './routes/observations';
import analysisRouter from './routes/analysis';
import importRouter from './routes/import';
import { resetSampleData } from './sampleData';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

app.use(cors());
app.use(express.text({ type: ['text/*', 'application/csv'], limit: '10mb' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

initDatabase();
insertSampleData();

app.use('/api/trees', treesRouter);
app.use('/api/observations', observationsRouter);
app.use('/api/analysis', analysisRouter);
app.use('/api/import', importRouter);

app.post('/api/sample/reset', (_req, res) => {
  try {
    resetSampleData();
    res.json({ success: true, message: '已重置为Sample数据' });
  } catch (error) {
    res.status(500).json({ success: false, error: '重置失败' });
  }
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

const distPath = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));

  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
