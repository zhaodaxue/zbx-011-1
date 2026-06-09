import type {
  AnalysisRequest,
  AnalysisResponse,
  ImportResponse,
  ImportObservation,
} from '../../shared/types';

export const api = {
  async getStreets(): Promise<string[]> {
    const res = await fetch('/api/trees/streets');
    if (!res.ok) throw new Error('获取街巷列表失败');
    return res.json();
  },

  async getAnalysis(params: AnalysisRequest): Promise<AnalysisResponse> {
    const res = await fetch('/api/analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error('获取分析数据失败');
    return res.json();
  },

  async importCSV(csvContent: string): Promise<ImportResponse> {
    const res = await fetch('/api/import/csv', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: csvContent,
    });
    if (!res.ok) throw new Error('导入失败');
    return res.json();
  },

  async importJSON(observations: ImportObservation[]): Promise<ImportResponse> {
    const res = await fetch('/api/import/json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(observations),
    });
    if (!res.ok) throw new Error('导入失败');
    return res.json();
  },

  async resetSample(): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/sample/reset', {
      method: 'POST',
    });
    if (!res.ok) throw new Error('重置失败');
    return res.json();
  },
};
