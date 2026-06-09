import { db } from '../db';
import type { Observation, ImportObservation } from '../../shared/types';

export const observationRepository = {
  findByTreeIdAndDateRange(
    treeId: string,
    startDate?: string,
    endDate?: string
  ): Observation[] {
    let sql = 'SELECT * FROM observations WHERE treeId = ?';
    const params: (string | number)[] = [treeId];

    if (startDate) {
      sql += ' AND observationDate >= ?';
      params.push(startDate);
    }
    if (endDate) {
      sql += ' AND observationDate <= ?';
      params.push(endDate);
    }

    sql += ' ORDER BY observationDate';

    return db.prepare(sql).all(...params) as unknown as Observation[];
  },

  findByTreeIdsAndDateRange(
    treeIds: string[],
    startDate?: string,
    endDate?: string
  ): Observation[] {
    if (treeIds.length === 0) return [];

    const placeholders = treeIds.map(() => '?').join(',');
    let sql = `SELECT * FROM observations WHERE treeId IN (${placeholders})`;
    const params: (string | number)[] = [...treeIds];

    if (startDate) {
      sql += ' AND observationDate >= ?';
      params.push(startDate);
    }
    if (endDate) {
      sql += ' AND observationDate <= ?';
      params.push(endDate);
    }

    sql += ' ORDER BY treeId, observationDate';

    return db.prepare(sql).all(...params) as unknown as Observation[];
  },

  insertMany(observations: ImportObservation[]): number {
    if (observations.length === 0) return 0;

    const insert = db.prepare(
      'INSERT INTO observations (treeId, observationDate, tension, tiltAngle) VALUES (?, ?, ?, ?)'
    );

    const transaction = db.transaction((obs: ImportObservation[]) => {
      let count = 0;
      for (const o of obs) {
        const result = insert.run(
          o.treeId,
          o.observationDate,
          o.tension,
          o.tiltAngle
        );
        if (result.changes > 0) count++;
      }
      return count;
    });

    return transaction(observations);
  },

  count(): number {
    const row = db
      .prepare('SELECT COUNT(*) as count FROM observations')
      .get() as unknown as { count: number };
    return row.count;
  },
};
