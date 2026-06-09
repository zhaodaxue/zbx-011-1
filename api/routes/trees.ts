import { Router } from 'express';
import { treeRepository } from '../repositories/treeRepository';

const router = Router();

router.get('/', (req, res) => {
  const streets = req.query.streets as string | string[] | undefined;

  let trees;
  if (streets) {
    const streetArray = Array.isArray(streets) ? streets : [streets];
    trees = treeRepository.findByStreets(streetArray);
  } else {
    trees = treeRepository.findAll();
  }

  res.json(trees);
});

router.get('/streets', (_req, res) => {
  const streets = treeRepository.getAllStreets();
  res.json(streets);
});

router.get('/:treeId', (req, res) => {
  const tree = treeRepository.findById(req.params.treeId);
  if (tree) {
    res.json(tree);
  } else {
    res.status(404).json({ error: 'Tree not found' });
  }
});

export default router;
