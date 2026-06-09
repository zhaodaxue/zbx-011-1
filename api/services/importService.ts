import Papa from 'papaparse';
import { treeRepository } from '../repositories/treeRepository';
import { observationRepository } from '../repositories/observationRepository';
import type { ImportObservation, ImportResponse } from '../../shared/types';

function validateDate(dateStr: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) return false;
  const date = new Date(dateStr);
  return date instanceof Date && !isNaN(date.getTime());
}

function parseCSV(content: string): { data: ImportObservation[]; errors: string[] } {
  const result = Papa.parse<Record<string, string>>(content, {
    header: true,
    skipEmptyLines: true,
  });

  const observations: ImportObservation[] = [];
  const errors: string[] = [];

  const rows = result.data as Record<string, string>[];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    for (const key of Object.keys(row)) {
      const trimmedKey = key.trim();
      if (trimmedKey !== key) {
        row[trimmedKey] = row[key];
        delete row[key];
      }
    }
    const lineNum = i + 2;

    const treeId = row['树号'] || row['treeId'] || row['tree_id'];
    const observationDate = row['观测日期'] || row['observationDate'] || row['date'];
    const tensionStr = row['支撑索张力千牛'] || row['tension'] || row['张力'];
    const tiltAngleStr = row['倾斜角分'] || row['tiltAngle'] || row['倾斜角'];

    if (!treeId) {
      errors.push(`第${lineNum}行：缺少树号`);
      continue;
    }

    if (!observationDate) {
      errors.push(`第${lineNum}行：缺少观测日期`);
      continue;
    }

    if (!validateDate(observationDate)) {
      errors.push(`第${lineNum}行：日期格式错误，请使用 YYYY-MM-DD`);
      continue;
    }

    const tension = parseFloat(tensionStr);
    if (isNaN(tension) || tension < 0) {
      errors.push(`第${lineNum}行：张力值无效`);
      continue;
    }

    const tiltAngle = parseFloat(tiltAngleStr);
    if (isNaN(tiltAngle)) {
      errors.push(`第${lineNum}行：倾斜角值无效`);
      continue;
    }

    if (!treeRepository.exists(treeId)) {
      errors.push(`第${lineNum}行：树号 ${treeId} 不存在`);
      continue;
    }

    observations.push({
      treeId,
      observationDate,
      tension,
      tiltAngle,
    });
  }

  return { data: observations, errors };
}

export const importService = {
  importFromCSV(content: string): ImportResponse {
    const { data, errors } = parseCSV(content);

    if (data.length === 0) {
      return {
        success: false,
        importedCount: 0,
        errors: errors.length > 0 ? errors : ['未解析到有效的观测数据，请检查 CSV 格式与列名'],
      };
    }

    const importedCount = observationRepository.insertMany(data);

    return {
      success: true,
      importedCount,
      errors,
    };
  },

  importFromJSON(observations: ImportObservation[]): ImportResponse {
    const errors: string[] = [];
    const valid: ImportObservation[] = [];

    for (let i = 0; i < observations.length; i++) {
      const obs = observations[i];

      if (!obs.treeId) {
        errors.push(`第${i + 1}条：缺少树号`);
        continue;
      }

      if (!validateDate(obs.observationDate)) {
        errors.push(`第${i + 1}条：日期格式错误`);
        continue;
      }

      if (typeof obs.tension !== 'number' || obs.tension < 0) {
        errors.push(`第${i + 1}条：张力值无效`);
        continue;
      }

      if (typeof obs.tiltAngle !== 'number') {
        errors.push(`第${i + 1}条：倾斜角值无效`);
        continue;
      }

      if (!treeRepository.exists(obs.treeId)) {
        errors.push(`第${i + 1}条：树号 ${obs.treeId} 不存在`);
        continue;
      }

      valid.push(obs);
    }

    if (valid.length === 0) {
      return {
        success: false,
        importedCount: 0,
        errors: errors.length > 0 ? errors : ['未解析到有效的观测数据'],
      };
    }

    const importedCount = observationRepository.insertMany(valid);

    return {
      success: true,
      importedCount,
      errors,
    };
  },
};
