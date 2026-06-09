import { AlertTriangle, TreeDeciduous, MapPin, TrendingDown, Filter, CheckSquare } from 'lucide-react';
import { useAnalysisStore } from '../store/useAnalysisStore';
import type { TreeAnalysis } from '../../shared/types';

export function SuspectList() {
  const {
    analysisData,
    loading,
    selectedTreeId,
    setSelectedTreeId,
    comparisonSet,
    toggleComparisonTree,
    brushSelection,
    clearBrushSelection,
    isTreeInBrush,
    getTreeColor,
  } = useAnalysisStore();

  const allSuspects = analysisData?.suspectedTrees ?? [];
  const filteredSuspects = brushSelection
    ? allSuspects.filter((t) => isTreeInBrush(t))
    : allSuspects;

  const handleCardClick = (tree: TreeAnalysis) => {
    if (selectedTreeId === tree.treeId) {
      toggleComparisonTree(tree.treeId);
    } else {
      setSelectedTreeId(tree.treeId);
    }
  };

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
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
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
        <div className="text-right">
          <div className="text-2xl font-bold text-amber-600 font-mono">
            {filteredSuspects.length}
          </div>
          <div className="text-xs text-gray-400">
            {brushSelection ? `框选筛选/共 ${allSuspects.length}棵` : '嫌疑总数'}
          </div>
        </div>
      </div>

      {brushSelection && (
        <div className="mb-4 p-3 bg-amber-50 rounded-lg border border-amber-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-amber-700">
            <Filter className="w-4 h-4" />
            <span>
              已启用框选筛选，仅展示命中框选区域的
              <strong> {filteredSuspects.length} </strong>棵嫌疑古树
            </span>
          </div>
          <button
            onClick={clearBrushSelection}
            className="text-xs px-2.5 py-1 bg-white border border-amber-300 rounded-md hover:bg-amber-100 text-amber-700 transition-colors"
          >
            清除筛选
          </button>
        </div>
      )}

      {filteredSuspects.length === 0 ? (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-50 rounded-full mb-4">
            <TreeDeciduous className="w-8 h-8 text-green-500" />
          </div>
          <p className="text-gray-500">
            {brushSelection
              ? '当前框选范围内未发现嫌疑古树'
              : '当前筛选条件下未发现嫌疑古树'}
          </p>
          <p className="text-sm text-gray-400 mt-1">
            {brushSelection ? '尝试调整框选区域或清除筛选' : '所有古树支撑系统状态正常'}
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
          {filteredSuspects.map((tree, idx) => {
            const isInComparison = comparisonSet.includes(tree.treeId);
            const color = isInComparison ? getTreeColor(tree.treeId) : null;
            return (
              <div
                key={tree.treeId}
                onClick={() => handleCardClick(tree)}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 relative ${
                  selectedTreeId === tree.treeId
                    ? 'border-amber-500 bg-amber-50 shadow-md'
                    : 'border-amber-100 bg-amber-50/50 hover:border-amber-300 hover:shadow-sm'
                }`}
                style={
                  isInComparison && color
                    ? {
                        borderLeftWidth: 6,
                        borderLeftColor: color,
                      }
                    : undefined
                }
              >
                {isInComparison && color && (
                  <div
                    className="absolute top-2 right-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor: `color-mix(in srgb, ${color} 12%, white)`,
                      color,
                      border: `1px solid color-mix(in srgb, ${color} 30%, transparent)`,
                    }}
                  >
                    <CheckSquare className="w-3 h-3" />
                    对比中
                  </div>
                )}

                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        isInComparison && color ? '' : 'bg-amber-200'
                      }`}
                      style={
                        isInComparison && color
                          ? { backgroundColor: `color-mix(in srgb, ${color} 20%, white)` }
                          : undefined
                      }
                    >
                      <span
                        className={`font-mono font-bold ${
                          isInComparison && color ? '' : 'text-amber-700'
                        }`}
                        style={isInComparison && color ? { color } : undefined}
                      >
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

                {selectedTreeId === tree.treeId && (
                  <div className="mt-3 pt-2 border-t border-amber-200/50 text-xs text-amber-600 flex items-center gap-1">
                    💡 再次点击可快速加入/移出对比集
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {brushSelection && allSuspects.length > 0 && filteredSuspects.length < allSuspects.length && (
        <div className="mt-4 pt-4 border-t border-amber-100 text-center">
          <p className="text-xs text-gray-400">
            另有 <strong className="text-gray-500">{allSuspects.length - filteredSuspects.length}</strong> 棵嫌疑古树未在框选范围内
          </p>
        </div>
      )}
    </div>
  );
}
