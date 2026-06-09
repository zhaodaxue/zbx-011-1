import { Router } from 'express';
import { treeRepository } from '../repositories/treeRepository';
import { observationRepository } from '../repositories/observationRepository';
import { analysisService } from '../services/analysisService';
import type { AnalysisRequest, AnalysisResponse, TreeAnalysis } from '../../shared/types';

const router = Router();

router.post('/', (req, res) => {
  const body = req.body as AnalysisRequest;
  const { streets, startDate, endDate } = body;

  let trees = streets && streets.length > 0
    ? treeRepository.findByStreets(streets)
    : treeRepository.findAll();

  const treeIds = trees.map((t) => t.treeId);
  const allObservations = observationRepository.findByTreeIdsAndDateRange(
    treeIds,
    startDate,
    endDate
  );

  const observationsByTree = new Map<string, typeof allObservations>();
  for (const obs of allObservations) {
    if (!observationsByTree.has(obs.treeId)) {
      observationsByTree.set(obs.treeId, []);
    }
    observationsByTree.get(obs.treeId)!.push(obs);
  }

  const analysisResults: TreeAnalysis[] = [];
  let totalObservations = 0;
  let validCorrelations = 0;
  let correlationSum = 0;

  for (const tree of trees) {
    const observations = observationsByTree.get(tree.treeId) || [];
    totalObservations += observations.length;

    if (observations.length >= 2) {
      const analysis = analysisService.analyzeTree(tree, observations);
      analysisResults.push(analysis);

      if (!isNaN(analysis.correlationCoefficient)) {
        validCorrelations++;
        correlationSum += analysis.correlationCoefficient;
      }
    } else {
      analysisResults.push({
        treeId: tree.treeId,
        species: tree.species,
        street: tree.street,
        correlationCoefficient: NaN,
        observationCount: observations.length,
        firstTiltAngle: observations[0]?.tiltAngle || 0,
        lastTiltAngle: observations[observations.length - 1]?.tiltAngle || 0,
        tiltAngleIncrease: 0,
        isSuspected: false,
        observations: observations.map((o) => ({
          tension: o.tension,
          tiltAngle: o.tiltAngle,
          observationDate: o.observationDate,
        })),
      });
    }
  }

  analysisResults.sort(
    (a, b) =>
      (isNaN(a.correlationCoefficient) ? 1 : a.correlationCoefficient) -
      (isNaN(b.correlationCoefficient) ? 1 : b.correlationCoefficient)
  );

  const suspectedTrees = analysisResults.filter((t) => t.isSuspected);

  const response: AnalysisResponse = {
    trees: analysisResults,
    suspectedTrees,
    statistics: {
      totalTrees: trees.length,
      totalObservations,
      suspectedCount: suspectedTrees.length,
      avgCorrelation: validCorrelations > 0
        ? Math.round((correlationSum / validCorrelations) * 1000) / 1000
        : 0,
    },
  };

  res.json(response);
});

export default router;
