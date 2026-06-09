import { Router } from 'express';
import { observationRepository } from '../repositories/observationRepository';

const router = Router();

router.get('/', (req, res) => {
  const treeId = req.query.treeId as string | undefined;
  const startDate = req.query.startDate as string | undefined;
  const endDate = req.query.endDate as string | undefined;

  if (!treeId) {
    return res.status(400).json({ error: 'treeId is required' });
  }

  const observations = observationRepository.findByTreeIdAndDateRange(
    treeId,
    startDate,
    endDate
  );

  res.json(observations);
});

export default router;
