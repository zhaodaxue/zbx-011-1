import { Router } from 'express';
import { importService } from '../services/importService';
import type { ImportObservation } from '../../shared/types';

const router = Router();

router.post('/csv', (req, res) => {
  const contentType = req.headers['content-type'];

  if (contentType?.includes('multipart/form-data')) {
    if (!req.body || !req.body.csv) {
      return res.status(400).json({
        success: false,
        importedCount: 0,
        errors: ['未接收到CSV文件内容'],
      });
    }
    const result = importService.importFromCSV(req.body.csv);
    return res.json(result);
  }

  if (typeof req.body === 'string') {
    const result = importService.importFromCSV(req.body);
    return res.json(result);
  }

  if (req.body?.csv) {
    const result = importService.importFromCSV(req.body.csv);
    return res.json(result);
  }

  return res.status(400).json({
    success: false,
    importedCount: 0,
    errors: ['请求格式错误'],
  });
});

router.post('/json', (req, res) => {
  const observations = req.body as ImportObservation[];

  if (!Array.isArray(observations)) {
    return res.status(400).json({
      success: false,
      importedCount: 0,
      errors: ['数据格式错误，应为数组'],
    });
  }

  const result = importService.importFromJSON(observations);
  res.json(result);
});

export default router;
