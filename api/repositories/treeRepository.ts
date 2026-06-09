import { db } from '../db';
import type { Tree } from '../../shared/types';

export const treeRepository = {
  findAll(): Tree[] {
    return db.prepare('SELECT * FROM trees ORDER BY treeId').all() as unknown as Tree[];
  },

  findByStreets(streets: string[]): Tree[] {
    const placeholders = streets.map(() => '?').join(',');
    return db
      .prepare(`SELECT * FROM trees WHERE street IN (${placeholders}) ORDER BY treeId`)
      .all(...streets) as unknown as Tree[];
  },

  findById(treeId: string): Tree | undefined {
    return db.prepare('SELECT * FROM trees WHERE treeId = ?').get(treeId) as unknown as
      | Tree
      | undefined;
  },

  getAllStreets(): string[] {
    const rows = db
      .prepare('SELECT DISTINCT street FROM trees ORDER BY street')
      .all() as unknown as { street: string }[];
    return rows.map((r) => r.street);
  },

  exists(treeId: string): boolean {
    const row = db
      .prepare('SELECT 1 FROM trees WHERE treeId = ?')
      .get(treeId) as unknown as { '1': number } | undefined;
    return !!row;
  },
};
