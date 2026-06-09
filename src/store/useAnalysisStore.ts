import { create } from 'zustand';
import type { AnalysisResponse, AnalysisRequest, TreeAnalysis } from '../../shared/types';
import { api } from '../utils/api';

export interface BrushSelection {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

const STORAGE_KEYS = {
  COMPARISON_SET: 'analysis_comparison_set',
  BRUSH_SELECTION: 'analysis_brush_selection',
  HIDDEN_TREES: 'analysis_hidden_trees',
};

const TREE_COLORS = [
  '#1B4332',
  '#dc2626',
  '#2563eb',
];

interface AnalysisState {
  loading: boolean;
  streets: string[];
  selectedStreets: string[];
  startDate: string;
  endDate: string;
  analysisData: AnalysisResponse | null;
  selectedTreeId: string | null;
  error: string | null;
  comparisonSet: string[];
  hiddenTrees: string[];
  brushSelection: BrushSelection | null;
  toastMessage: string | null;

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

  toggleComparisonTree: (treeId: string) => void;
  addToComparisonSet: (treeId: string) => boolean;
  removeFromComparisonSet: (treeId: string) => void;
  clearComparisonSet: () => void;
  toggleTreeVisibility: (treeId: string) => void;
  setBrushSelection: (selection: BrushSelection | null) => void;
  clearBrushSelection: () => void;
  clearAllSelectionState: () => void;
  setToastMessage: (msg: string | null) => void;
  getTreeColor: (treeId: string) => string;
  isTreeInBrush: (tree: TreeAnalysis) => boolean;
}

function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const stored = sessionStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // ignore
  }
  return defaultValue;
}

function saveToStorage<T>(key: string, value: T): void {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
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
  comparisonSet: loadFromStorage<string[]>(STORAGE_KEYS.COMPARISON_SET, []),
  hiddenTrees: loadFromStorage<string[]>(STORAGE_KEYS.HIDDEN_TREES, []),
  brushSelection: loadFromStorage<BrushSelection | null>(STORAGE_KEYS.BRUSH_SELECTION, null),
  toastMessage: null,

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
      const prevComparison = get().comparisonSet;
      const prevHidden = get().hiddenTrees;
      const prevBrush = get().brushSelection;

      const firstTreeId = data.trees[0]?.treeId || null;
      const stillExists =
        prevSelected != null &&
        data.trees.some((t) => t.treeId === prevSelected);

      const validTreeIds = new Set(data.trees.map((t) => t.treeId));
      const filteredComparison = prevComparison.filter((id) => validTreeIds.has(id));
      const filteredHidden = prevHidden.filter((id) => validTreeIds.has(id));
      const brushStillValid = prevBrush && filteredComparison.length > 0;

      saveToStorage(STORAGE_KEYS.COMPARISON_SET, filteredComparison);
      saveToStorage(STORAGE_KEYS.HIDDEN_TREES, filteredHidden);
      if (brushStillValid) {
        saveToStorage(STORAGE_KEYS.BRUSH_SELECTION, prevBrush);
      } else {
        sessionStorage.removeItem(STORAGE_KEYS.BRUSH_SELECTION);
      }

      set({
        analysisData: data,
        selectedTreeId: stillExists ? prevSelected : firstTreeId,
        comparisonSet: filteredComparison,
        hiddenTrees: filteredHidden,
        brushSelection: brushStillValid ? prevBrush : null,
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

  setSelectedTreeId: (treeId) => {
    if (!treeId) {
      set({ selectedTreeId: null });
      return;
    }
    const { analysisData, comparisonSet } = get();
    const tree = analysisData?.trees.find((t) => t.treeId === treeId);

    set({ selectedTreeId: treeId });

    if (tree && !comparisonSet.includes(treeId)) {
      if (tree.observationCount < 2) {
        set({ toastMessage: `"${treeId}" 观测不足2次，无法加入对比集` });
        setTimeout(() => set({ toastMessage: null }), 3000);
        return;
      }
      if (comparisonSet.length < 3) {
        const newComparison = [...comparisonSet, treeId];
        saveToStorage(STORAGE_KEYS.COMPARISON_SET, newComparison);
        set({ comparisonSet: newComparison });
      }
    }
  },

  resetSampleData: async () => {
    set({ loading: true, error: null });
    try {
      await api.resetSample();
      set({
        comparisonSet: [],
        hiddenTrees: [],
        brushSelection: null,
      });
      sessionStorage.removeItem(STORAGE_KEYS.COMPARISON_SET);
      sessionStorage.removeItem(STORAGE_KEYS.HIDDEN_TREES);
      sessionStorage.removeItem(STORAGE_KEYS.BRUSH_SELECTION);
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
        set({
          comparisonSet: [],
          hiddenTrees: [],
          brushSelection: null,
        });
        sessionStorage.removeItem(STORAGE_KEYS.COMPARISON_SET);
        sessionStorage.removeItem(STORAGE_KEYS.HIDDEN_TREES);
        sessionStorage.removeItem(STORAGE_KEYS.BRUSH_SELECTION);
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

  toggleComparisonTree: (treeId) => {
    const { analysisData, comparisonSet } = get();
    const tree = analysisData?.trees.find((t) => t.treeId === treeId);

    if (comparisonSet.includes(treeId)) {
      const newComparison = comparisonSet.filter((id) => id !== treeId);
      const newHidden = get().hiddenTrees.filter((id) => id !== treeId);
      saveToStorage(STORAGE_KEYS.COMPARISON_SET, newComparison);
      saveToStorage(STORAGE_KEYS.HIDDEN_TREES, newHidden);
      set({ comparisonSet: newComparison, hiddenTrees: newHidden });
      return;
    }

    if (tree && tree.observationCount < 2) {
      set({ toastMessage: `"${treeId}" 观测不足2次，无法加入对比集（至少需要2次观测）` });
      setTimeout(() => set({ toastMessage: null }), 3500);
      return;
    }

    if (comparisonSet.length >= 3) {
      set({ toastMessage: '对比集最多只能选择3棵古树' });
      setTimeout(() => set({ toastMessage: null }), 3000);
      return;
    }

    const newComparison = [...comparisonSet, treeId];
    saveToStorage(STORAGE_KEYS.COMPARISON_SET, newComparison);
    set({ comparisonSet: newComparison });
  },

  addToComparisonSet: (treeId) => {
    const { analysisData, comparisonSet } = get();
    const tree = analysisData?.trees.find((t) => t.treeId === treeId);

    if (comparisonSet.includes(treeId)) {
      return true;
    }

    if (tree && tree.observationCount < 2) {
      set({ toastMessage: `"${treeId}" 观测不足2次，无法加入对比集` });
      setTimeout(() => set({ toastMessage: null }), 3000);
      return false;
    }

    if (comparisonSet.length >= 3) {
      set({ toastMessage: '对比集最多只能选择3棵古树' });
      setTimeout(() => set({ toastMessage: null }), 3000);
      return false;
    }

    const newComparison = [...comparisonSet, treeId];
    saveToStorage(STORAGE_KEYS.COMPARISON_SET, newComparison);
    set({ comparisonSet: newComparison });
    return true;
  },

  removeFromComparisonSet: (treeId) => {
    const newComparison = get().comparisonSet.filter((id) => id !== treeId);
    const newHidden = get().hiddenTrees.filter((id) => id !== treeId);
    saveToStorage(STORAGE_KEYS.COMPARISON_SET, newComparison);
    saveToStorage(STORAGE_KEYS.HIDDEN_TREES, newHidden);
    set({ comparisonSet: newComparison, hiddenTrees: newHidden });
  },

  clearComparisonSet: () => {
    saveToStorage(STORAGE_KEYS.COMPARISON_SET, []);
    saveToStorage(STORAGE_KEYS.HIDDEN_TREES, []);
    set({ comparisonSet: [], hiddenTrees: [] });
  },

  toggleTreeVisibility: (treeId) => {
    const { hiddenTrees } = get();
    const newHidden = hiddenTrees.includes(treeId)
      ? hiddenTrees.filter((id) => id !== treeId)
      : [...hiddenTrees, treeId];
    saveToStorage(STORAGE_KEYS.HIDDEN_TREES, newHidden);
    set({ hiddenTrees: newHidden });
  },

  setBrushSelection: (selection) => {
    if (selection) {
      saveToStorage(STORAGE_KEYS.BRUSH_SELECTION, selection);
    } else {
      sessionStorage.removeItem(STORAGE_KEYS.BRUSH_SELECTION);
    }
    set({ brushSelection: selection });
  },

  clearBrushSelection: () => {
    sessionStorage.removeItem(STORAGE_KEYS.BRUSH_SELECTION);
    set({ brushSelection: null });
  },

  clearAllSelectionState: () => {
    sessionStorage.removeItem(STORAGE_KEYS.COMPARISON_SET);
    sessionStorage.removeItem(STORAGE_KEYS.HIDDEN_TREES);
    sessionStorage.removeItem(STORAGE_KEYS.BRUSH_SELECTION);
    set({
      comparisonSet: [],
      hiddenTrees: [],
      brushSelection: null,
    });
  },

  setToastMessage: (msg) => set({ toastMessage: msg }),

  getTreeColor: (treeId) => {
    const { comparisonSet } = get();
    const idx = comparisonSet.indexOf(treeId);
    if (idx >= 0 && idx < TREE_COLORS.length) {
      return TREE_COLORS[idx];
    }
    return TREE_COLORS[0];
  },

  isTreeInBrush: (tree) => {
    const { brushSelection } = get();
    if (!brushSelection) return true;
    return tree.observations.some(
      (o) =>
        o.tension >= brushSelection.minX &&
        o.tension <= brushSelection.maxX &&
        o.tiltAngle >= brushSelection.minY &&
        o.tiltAngle <= brushSelection.maxY
    );
  },
}));

export const selectSelectedTree = (state: AnalysisState): TreeAnalysis | undefined => {
  if (!state.selectedTreeId || !state.analysisData) return undefined;
  return state.analysisData.trees.find((t) => t.treeId === state.selectedTreeId);
};

export const selectComparisonTrees = (state: AnalysisState): TreeAnalysis[] => {
  if (!state.analysisData) return [];
  return state.comparisonSet
    .map((id) => state.analysisData!.trees.find((t) => t.treeId === id))
    .filter((t): t is TreeAnalysis => t !== undefined);
};

export const selectBrushHitTrees = (state: AnalysisState): TreeAnalysis[] => {
  if (!state.analysisData || !state.brushSelection) return [];
  return state.analysisData.trees.filter((tree) =>
    tree.observations.some(
      (o) =>
        o.tension >= state.brushSelection!.minX &&
        o.tension <= state.brushSelection!.maxX &&
        o.tiltAngle >= state.brushSelection!.minY &&
        o.tiltAngle <= state.brushSelection!.maxY
    )
  );
};

export { TREE_COLORS };
