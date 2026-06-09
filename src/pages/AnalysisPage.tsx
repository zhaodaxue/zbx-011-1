import { useEffect } from 'react';
import { Trees, Leaf, AlertCircle, X } from 'lucide-react';
import { useAnalysisStore } from '../store/useAnalysisStore';
import { FilterPanel } from '../components/FilterPanel';
import { StatsCards } from '../components/StatsCards';
import { CorrelationTable } from '../components/CorrelationTable';
import { SuspectList } from '../components/SuspectList';
import { ScatterChart } from '../components/ScatterChart';
import { ImportPanel } from '../components/ImportPanel';

export function AnalysisPage() {
  const { init, loading, error, toastMessage, setToastMessage } = useAnalysisStore();

  useEffect(() => {
    init();
  }, [init]);

  return (
    <div className="min-h-screen pb-12">
      <header className="bg-gradient-to-r from-forest-800 to-forest-700 text-white py-10 px-6 mb-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-4 animate-fade-in-up">
            <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
              <Trees className="w-10 h-10 text-forest-100" />
            </div>
            <div>
              <h1 className="text-3xl font-bold font-serif tracking-wide">
                古树支撑索张力与树身倾斜角关联分析
              </h1>
              <p className="text-forest-200 mt-1 flex items-center gap-2">
                <Leaf className="w-4 h-4" />
                市政园林科 · 古树健康监测系统
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              <p className="text-forest-200 text-sm">分析指标</p>
              <p className="text-white font-semibold mt-1">皮尔逊相关系数</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <p className="text-forest-200 text-sm">嫌疑判定</p>
              <p className="text-white font-semibold mt-1">r &lt; -0.6 且 增量 &gt; 1.2分</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              <p className="text-forest-200 text-sm">数据更新</p>
              <p className="text-white font-semibold mt-1">支持CSV批量导入</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg animate-fade-in-up flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1">{error}</div>
          </div>
        )}

        <FilterPanel />
        <StatsCards />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <CorrelationTable />
          </div>
          <div>
            <SuspectList />
          </div>
        </div>

        <ScatterChart />
        <ImportPanel />
      </main>

      <footer className="mt-12 pt-8 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm text-gray-500">
          <p>市政园林科 · 古树保护数据分析平台</p>
          <p className="mt-1 text-xs text-gray-400">
            数据保存在本地SQLite数据库，Docker一键部署
          </p>
        </div>
      </footer>

      {loading && (
        <div className="fixed bottom-6 right-6 bg-forest-700 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 z-50">
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <span className="text-sm">处理中...</span>
        </div>
      )}

      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 animate-fade-in-up" style={{ zIndex: 100 }}>
          <div className="bg-amber-50 border-2 border-amber-300 text-amber-800 px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 max-w-md">
            <div className="p-1.5 bg-amber-100 rounded-lg flex-shrink-0">
              <AlertCircle className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1 text-sm font-medium">{toastMessage}</div>
            <button
              onClick={() => setToastMessage(null)}
              className="p-1 rounded-md hover:bg-amber-100 text-amber-600 transition-colors flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
