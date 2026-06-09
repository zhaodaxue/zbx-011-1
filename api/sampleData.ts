import { db } from './db';

const trees = [
  { treeId: 'G001', species: '古银杏', street: '中山路' },
  { treeId: 'G002', species: '古樟树', street: '中山路' },
  { treeId: 'G003', species: '古槐树', street: '人民路' },
  { treeId: 'G004', species: '古柏树', street: '人民路' },
  { treeId: 'G005', species: '古榕树', street: '解放路' },
  { treeId: 'G006', species: '古松树', street: '解放路' },
  { treeId: 'G007', species: '古榆树', street: '长江路' },
  { treeId: 'G008', species: '古柳树', street: '长江路' },
];

function generateObservations(): {
  treeId: string;
  observationDate: string;
  tension: number;
  tiltAngle: number;
}[] {
  const observations: {
    treeId: string;
    observationDate: string;
    tension: number;
    tiltAngle: number;
  }[] = [];

  const baseDate = new Date();
  baseDate.setFullYear(baseDate.getFullYear() - 1);
  baseDate.setDate(1);

  const treePatterns: Record<
    string,
    {
      baseTension: number;
      baseTilt: number;
      tensionTrend: number;
      tiltTrend: number;
      tensionNoise: number;
      tiltNoise: number;
      count: number;
    }
  > = {
    G001: {
      baseTension: 12.5,
      baseTilt: 2.1,
      tensionTrend: -0.25,
      tiltTrend: 0.18,
      tensionNoise: 0.8,
      tiltNoise: 0.15,
      count: 12,
    },
    G002: {
      baseTension: 10.0,
      baseTilt: 1.5,
      tensionTrend: -0.08,
      tiltTrend: 0.05,
      tensionNoise: 0.5,
      tiltNoise: 0.08,
      count: 12,
    },
    G003: {
      baseTension: 15.0,
      baseTilt: 3.0,
      tensionTrend: -0.35,
      tiltTrend: 0.22,
      tensionNoise: 1.0,
      tiltNoise: 0.2,
      count: 12,
    },
    G004: {
      baseTension: 9.5,
      baseTilt: 1.2,
      tensionTrend: -0.05,
      tiltTrend: 0.03,
      tensionNoise: 0.4,
      tiltNoise: 0.06,
      count: 12,
    },
    G005: {
      baseTension: 14.0,
      baseTilt: 2.5,
      tensionTrend: -0.3,
      tiltTrend: 0.2,
      tensionNoise: 0.9,
      tiltNoise: 0.18,
      count: 12,
    },
    G006: {
      baseTension: 11.0,
      baseTilt: 1.8,
      tensionTrend: -0.1,
      tiltTrend: 0.06,
      tensionNoise: 0.6,
      tiltNoise: 0.1,
      count: 12,
    },
    G007: {
      baseTension: 13.5,
      baseTilt: 2.2,
      tensionTrend: -0.03,
      tiltTrend: 0.02,
      tensionNoise: 0.45,
      tiltNoise: 0.07,
      count: 12,
    },
    G008: {
      baseTension: 8.5,
      baseTilt: 1.0,
      tensionTrend: 0.02,
      tiltTrend: -0.01,
      tensionNoise: 0.35,
      tiltNoise: 0.05,
      count: 12,
    },
  };

  for (const tree of trees) {
    const pattern = treePatterns[tree.treeId];
    for (let i = 0; i < pattern.count; i++) {
      const date = new Date(baseDate);
      date.setMonth(date.getMonth() + i);

      const tension =
        pattern.baseTension +
        pattern.tensionTrend * i +
        (Math.random() - 0.5) * 2 * pattern.tensionNoise;

      const tiltAngle =
        pattern.baseTilt +
        pattern.tiltTrend * i +
        (Math.random() - 0.5) * 2 * pattern.tiltNoise;

      observations.push({
        treeId: tree.treeId,
        observationDate: date.toISOString().split('T')[0],
        tension: Math.round(tension * 100) / 100,
        tiltAngle: Math.round(tiltAngle * 100) / 100,
      });
    }
  }

  return observations;
}

export function insertSampleData() {
  const existing = db
    .prepare('SELECT COUNT(*) as count FROM trees')
    .get() as unknown as { count: number };
  if (existing.count > 0) return;

  const insertTree = db.prepare(
    'INSERT INTO trees (treeId, species, street) VALUES (?, ?, ?)'
  );

  const insertObservation = db.prepare(
    'INSERT INTO observations (treeId, observationDate, tension, tiltAngle) VALUES (?, ?, ?, ?)'
  );

  const transaction = db.transaction(() => {
    for (const tree of trees) {
      insertTree.run(tree.treeId, tree.species, tree.street);
    }

    const observations = generateObservations();
    for (const obs of observations) {
      insertObservation.run(
        obs.treeId,
        obs.observationDate,
        obs.tension,
        obs.tiltAngle
      );
    }
  });

  transaction();
}

export function resetSampleData() {
  db.exec('DELETE FROM observations');
  db.exec('DELETE FROM trees');
  insertSampleData();
}
