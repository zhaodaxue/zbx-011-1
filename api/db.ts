import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function resolveDbPath(): string {
  if (process.env.DB_PATH) return process.env.DB_PATH;

  const possibleDataDirs = [
    path.join(process.cwd(), 'data'),
    path.join(__dirname, '..', '..', 'data'),
    path.join(__dirname, '..', 'data'),
    '/app/data',
  ];

  for (const dir of possibleDataDirs) {
    if (fs.existsSync(dir) || fs.existsSync(path.dirname(dir))) {
      return path.join(dir, 'trees.db');
    }
  }

  return path.join(process.cwd(), 'data', 'trees.db');
}

const dbPath = resolveDbPath();
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const nativeDb = new DatabaseSync(dbPath, {
  enableForeignKeyConstraints: true,
});

nativeDb.exec('PRAGMA journal_mode = WAL');
nativeDb.exec('PRAGMA foreign_keys = ON');

type TransactionFn<T extends (...args: never[]) => unknown> = (
  ...args: Parameters<T>
) => ReturnType<T>;

const db = Object.assign(nativeDb, {
  pragma(command: string) {
    nativeDb.exec(`PRAGMA ${command}`);
  },

  transaction<T extends (...args: never[]) => unknown>(fn: T): TransactionFn<T> {
    return (...args: Parameters<T>): ReturnType<T> => {
      nativeDb.exec('BEGIN');
      try {
        const result = fn(...args) as ReturnType<T>;
        nativeDb.exec('COMMIT');
        return result;
      } catch (error) {
        nativeDb.exec('ROLLBACK');
        throw error;
      }
    };
  },
});

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS trees (
      treeId TEXT PRIMARY KEY,
      species TEXT NOT NULL,
      street TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS observations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      treeId TEXT NOT NULL,
      observationDate TEXT NOT NULL,
      tension REAL NOT NULL,
      tiltAngle REAL NOT NULL,
      FOREIGN KEY (treeId) REFERENCES trees(treeId)
    );

    CREATE INDEX IF NOT EXISTS idx_observations_treeId ON observations(treeId);
    CREATE INDEX IF NOT EXISTS idx_observations_date ON observations(observationDate);
    CREATE INDEX IF NOT EXISTS idx_trees_street ON trees(street);
  `);
}

export { db, initDatabase };
