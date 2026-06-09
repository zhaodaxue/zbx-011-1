import type { Tree, TreeAnalysis, Observation } from '../../shared/types';

function calculatePearsonCorrelation(
  x: number[],
  y: number[]
): number {
  if (x.length !== y.length || x.length < 2) return NaN;

  const n = x.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;

  for (let i = 0; i < n; i++) {
    sumX += x[i];
    sumY += y[i];
    sumXY += x[i] * y[i];
    sumX2 += x[i] * x[i];
    sumY2 += y[i] * y[i];
  }

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt(
    (n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY)
  );

  if (denominator === 0) return NaN;

  return numerator / denominator;
}

function isSuspected(
  correlation: number,
  tiltIncrease: number
): boolean {
  return correlation < -0.6 && tiltIncrease > 1.2;
}

export const analysisService = {
  analyzeTree(
    tree: Tree,
    observations: Observation[]
  ): TreeAnalysis {
    if (observations.length < 2) {
      return {
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
      };
    }

    const sorted = [...observations].sort(
      (a, b) => a.observationDate.localeCompare(b.observationDate)
    );

    const tensions = sorted.map((o) => o.tension);
    const tilts = sorted.map((o) => o.tiltAngle);

    const correlation = calculatePearsonCorrelation(tensions, tilts);
    const firstTilt = sorted[0].tiltAngle;
    const lastTilt = sorted[sorted.length - 1].tiltAngle;
    const tiltIncrease = lastTilt - firstTilt;

    return {
      treeId: tree.treeId,
      species: tree.species,
      street: tree.street,
      correlationCoefficient: Math.round(correlation * 1000) / 1000,
      observationCount: observations.length,
      firstTiltAngle: firstTilt,
      lastTiltAngle: lastTilt,
      tiltAngleIncrease: Math.round(tiltIncrease * 100) / 100,
      isSuspected: isSuspected(correlation, tiltIncrease),
      observations: sorted.map((o) => ({
        tension: o.tension,
        tiltAngle: o.tiltAngle,
        observationDate: o.observationDate,
      })),
    };
  },
};
