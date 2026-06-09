import { AlertTriangle, TreeDeciduous, MapPin, TrendingDown } from 'lucide-react';
import { useAnalysisStore } from '../store/useAnalysisStore';

export function SuspectList() {
  const { analysisData, loading, selectedTreeId, setSelectedTreeId } =
    useAnalysisStore();
  const suspects = analysisData?.suspectedTrees ?? [];

  if (loading && !analysisData) {
    return (
      <div className="card animate-stagger" style={{ animationDelay: '0.7s' }}>
        <div className="animate-pulse space-y-3">
          <div className="h-6 bg-gray-200 rounded w-1/3" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className="card border-2 border-amber-200 animate-stagger"
      style={{ animationDelay: '0.7s' }}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-amber-100 rounded-lg">
          <AlertTriangle className="w-6 h-6 text-amber-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-forest-800 font-serif">
            索力失效嫌疑清单
          </h2>
          <p className="text-sm text-gray-500">
            相关系数 &lt; -0.6 且倾斜角增量 &gt; 1.2分
          </p>
        </div>
      </div>

      {suspects.length === 0 ? (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-50 rounded-full mb-4">
            <TreeDeciduous className="w-8 h-8 text-green-500" />
          </div>
          <p className="text-gray-500">当前筛选条件下未发现嫌疑古树</p>
          <p className="text-sm text-gray-400 mt-1">所有古树支撑系统状态正常</p>
        </div>
      ) : (
        <div className="space-y-3">
          {suspects.map((tree, idx) => (
            <div
              key={tree.treeId}
              onClick={() => setSelectedTreeId(tree.treeId)}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                selectedTreeId === tree.treeId
                  ? 'border-amber-500 bg-amber-50 shadow-md'
                  : 'border-amber-100 bg-amber-50/50 hover:border-amber-300 hover:shadow-sm'
              }`}
              style={{
                animationDelay: `${0.7 + idx * 0.1}s`,
                animation: 'fadeInUp 0.6s ease-out forwards',
                opacity: 0,
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-200 rounded-lg flex items-center justify-center">
                    <span className="font-mono font-bold text-amber-700">
                      {tree.treeId}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{tree.species}</p>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {tree.street}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">相关系数</p>
                  <p className="text-xl font-bold text-red-600 font-mono">
                    {tree.correlationCoefficient.toFixed(3)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-3 border-t border-amber-200">
                <div>
                  <p className="text-xs text-gray-500">观测次数</p>
                  <p className="font-mono font-semibold text-gray-700">
                    {tree.observationCount} 次
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">倾斜角增量</p>
                  <p className="font-mono font-semibold text-red-600">
                    +{tree.tiltAngleIncrease.toFixed(2)} 分
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">趋势</p>
                  <p className="flex items-center gap-1 text-red-600">
                    <TrendingDown className="w-4 h-4" />
                    <span className="text-sm font-medium">索力失效</span>
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
