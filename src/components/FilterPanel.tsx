import { Calendar, MapPin, Search, RotateCcw } from 'lucide-react';
import { useAnalysisStore } from '../store/useAnalysisStore';

export function FilterPanel() {
  const {
    streets,
    selectedStreets,
    startDate,
    endDate,
    loading,
    toggleStreet,
    setDateRange,
    fetchAnalysis,
    resetSampleData,
  } = useAnalysisStore();

  const handleQuery = () => {
    fetchAnalysis();
  };

  const handleReset = async () => {
    if (confirm('确定要重置为Sample数据吗？当前导入的数据将被清除。')) {
      await resetSampleData();
    }
  };

  return (
    <div className="card animate-stagger" style={{ animationDelay: '0.1s' }}>
      <div className="flex flex-col lg:flex-row lg:items-end gap-6">
        <div className="flex-1">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <MapPin className="w-4 h-4 text-forest-600" />
            街巷筛选
          </label>
          <div className="flex flex-wrap gap-2">
            {streets.map((street, idx) => (
              <button
                key={street}
                onClick={() => toggleStreet(street)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  selectedStreets.includes(street)
                    ? 'bg-forest-700 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                style={{ animationDelay: `${0.1 + idx * 0.05}s` }}
              >
                {street}
              </button>
            ))}
            {selectedStreets.length > 0 && (
              <button
                onClick={() => useAnalysisStore.getState().setSelectedStreets([])}
                className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 underline"
              >
                清除选择
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 text-forest-600" />
              日期范围
            </label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setDateRange(e.target.value, endDate)}
                className="input-field w-40 text-sm"
              />
              <span className="text-gray-400">至</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setDateRange(startDate, e.target.value)}
                className="input-field w-40 text-sm"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleQuery}
              disabled={loading}
              className="btn-primary flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              查询分析
            </button>
            <button
              onClick={handleReset}
              disabled={loading}
              className="btn-secondary flex items-center gap-2"
              title="重置为Sample数据"
            >
              <RotateCcw className="w-4 h-4" />
              重置
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
