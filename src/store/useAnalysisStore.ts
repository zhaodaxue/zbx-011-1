import { create } from 'zustand';
import type { AnalysisResponse, AnalysisRequest, TreeAnalysis } from '../../shared/types';
import { api } from '../utils/api';

interface AnalysisState {
  loading: boolean;
  streets: string[];
  selectedStreets: string[];
  startDate: string;
  endDate: string;
  analysisData: AnalysisResponse | null;
  selectedTreeId: string | null;
  error: string | null;

  init: () => Promise<void>;
  fetchStreets: () => Promise<void>;
  fetchAnalysis: () => Promise<void>;
  setSelectedStreets: (streets: string[]) => void;
  toggleStreet: (street: string) => void;
  setDateRange: (start: string, end: string) => void;
  setSelectedTreeId: (treeId: string | null) => void;
  resetSampleData: () => Promise<{ success: boolean }>;
  importCSV: (content: string) => Promise<{
    success: boolean;
    importedCount: number;
    errors: string[];
  }>;
}

export const useAnalysisStore = create<AnalysisState>((set, get) => ({
  loading: false,
  streets: [],
  selectedStreets: [],
  startDate: '',
  endDate: '',
  analysisData: null,
  selectedTreeId: null,
  error: null,

  init: async () => {
    await get().fetchStreets();
    const now = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(now.getFullYear() - 1);
    oneYearAgo.setDate(1);
    set({
      startDate: oneYearAgo.toISOString().split('T')[0],
      endDate: now.toISOString().split('T')[0],
    });
    await get().fetchAnalysis();
  },

  fetchStreets: async () => {
    try {
      const streets = await api.getStreets();
      set({ streets });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '获取街巷列表失败' });
    }
  },

  fetchAnalysis: async () => {
    const { selectedStreets, startDate, endDate } = get();
    set({ loading: true, error: null });
    try {
      const params: AnalysisRequest = {
        streets: selectedStreets.length > 0 ? selectedStreets : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      };
      const data = await api.getAnalysis(params);
      const prevSelected = get().selectedTreeId;
      const firstTreeId = data.trees[0]?.treeId || null;
      const stillExists =
        prevSelected != null &&
        data.trees.some((t) => t.treeId === prevSelected);
      set({
        analysisData: data,
        selectedTreeId: stillExists ? prevSelected : firstTreeId,
      });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '获取分析数据失败' });
    } finally {
      set({ loading: false });
    }
  },

  setSelectedStreets: (streets) => set({ selectedStreets: streets }),

  toggleStreet: (street) => {
    const { selectedStreets } = get();
    const newSelected = selectedStreets.includes(street)
      ? selectedStreets.filter((s) => s !== street)
      : [...selectedStreets, street];
    set({ selectedStreets: newSelected });
  },

  setDateRange: (start, end) => set({ startDate: start, endDate: end }),

  setSelectedTreeId: (treeId) => set({ selectedTreeId: treeId }),

  resetSampleData: async () => {
    set({ loading: true, error: null });
    try {
      await api.resetSample();
      await get().fetchStreets();
      await get().fetchAnalysis();
      return { success: true };
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '重置失败' });
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  importCSV: async (content) => {
    set({ loading: true, error: null });
    try {
      const result = await api.importCSV(content);
      if (result.importedCount > 0) {
        await get().fetchStreets();
        await get().fetchAnalysis();
      }
      return result;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '导入失败' });
      throw err;
    } finally {
      set({ loading: false });
    }
  },
}));

export const selectSelectedTree = (state: AnalysisState): TreeAnalysis | undefined => {
  if (!state.selectedTreeId || !state.analysisData) return undefined;
  return state.analysisData.trees.find((t) => t.treeId === state.selectedTreeId);
};
