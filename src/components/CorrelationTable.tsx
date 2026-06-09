import { AlertCircle, CheckCircle, HelpCircle, CheckSquare, Square, Info } from 'lucide-react';
import { useAnalysisStore, selectSelectedTree } from '../store/useAnalysisStore';
import type { TreeAnalysis } from '../../shared/types';

function getCorrelationColor(r: number): string {
  if (isNaN(r)) return 'text-gray-400';
  if (r < -0.6) return 'text-red-600 font-bold';
  if (r < -0.3) return 'text-orange-500';
  if (r < 0) return 'text-yellow-600';
  if (r < 0.3) return 'text-gray-600';
  return 'text-green-600';
}

function getCorrelationBg(r: number): string {
  if (isNaN(r)) return 'bg-gray-100';
  if (r < -0.6) return 'bg-red-50';
  if (r < -0.3) return 'bg-orange-50';
  if (r < 0) return 'bg-yellow-50';
  return 'bg-green-50/50';
}

function formatValue(v: number | undefined): string {
  if (v === undefined || isNaN(v)) return '—';
  return v.toFixed(2);
}

export function CorrelationTable() {
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
  const selectedTree = useAnalysisStore(selectSelectedTree);

  const trees = analysisData?.trees ?? [];
  const brushHitCount = brushSelection
    ? trees.filter((t) => isTreeInBrush(t)).length
    : 0;

  const handleRowClick = (tree: TreeAnalysis) => {
    if (selectedTreeId === tree.treeId) {
      toggleComparisonTree(tree.treeId);
    } else {
      setSelectedTreeId(tree.treeId);
    }
  };

  const handleCheckboxClick = (e: React.MouseEvent, tree: TreeAnalysis) => {
    e.stopPropagation();
    toggleComparisonTree(tree.treeId);
  };

  if (loading && !analysisData) {
    return (
      <div className="card animate-stagger" style={{ animationDelay: '0.6s' }}>
        <div className="animate-pulse space-y-3">
          <div className="h-6 bg-gray-200 rounded w-1/3" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="card animate-stagger" style={{ animationDelay: '0.6s' }}>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
        <div>
          <h2 className="text-lg font-semibold text-forest-800 font-serif">
            各古树相关系数排序
          </h2>
          {brushSelection && (
            <p className="text-xs text-forest-600 mt-1 flex items-center gap-1">
              <Info className="w-3.5 h-3.5" />
              当前框选命中 <strong>{brushHitCount}</strong> 棵古树
              {brushHitCount < trees.length && (
                <span className="text-gray-400">
                  （共 {trees.length} 棵，未命中行已淡化）
                </span>
              )}
              <button
                onClick={clearBrushSelection}
                className="ml-2 underline hover:text-forest-800"
              >
                取消框选
              </button>
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-green-500" />
            <span>正常</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-yellow-500" />
            <span>轻度相关</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-orange-500" />
            <span>中度负相关</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-red-500" />
            <span>高度负相关</span>
          </div>
          <div className="h-4 w-px bg-gray-200 mx-1" />
          <div className="flex items-center gap-1 text-forest-700">
            <CheckSquare className="w-3.5 h-3.5" />
            <span>勾选加入对比 (最多3棵)</span>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-100">
        <table className="w-full">
          <thead>
            <tr>
              <th className="table-header w-10 text-center">
                <span className="sr-only">对比</span>
              </th>
              <th className="table-header w-12">状态</th>
              <th className="table-header">树号</th>
              <th className="table-header">树种</th>
              <th className="table-header">街巷</th>
              <th className="table-header text-right">相关系数</th>
              <th className="table-header text-right">观测次数</th>
              <th className="table-header text-right">首次倾斜角</th>
              <th className="table-header text-right">末次倾斜角</th>
              <th className="table-header text-right">倾斜角增量</th>
            </tr>
          </thead>
          <tbody>
            {trees.length === 0 ? (
              <tr>
                <td
                  colSpan={10}
                  className="table-cell text-center py-8 text-gray-400"
                >
                  暂无数据
                </td>
              </tr>
            ) : (
              trees.map((tree, idx) => {
                const isInBrush = isTreeInBrush(tree);
                const isChecked = comparisonSet.includes(tree.treeId);
                const canCompare = tree.observationCount >= 2;
                const isDisabled =
                  !isChecked && comparisonSet.length >= 3 && !canCompare;
                const color = isChecked ? getTreeColor(tree.treeId) : null;

                return (
                  <tr
                    key={tree.treeId}
                    onClick={() => handleRowClick(tree)}
                    className={`cursor-pointer transition-all duration-200 hover:bg-forest-50 ${
                      selectedTreeId === tree.treeId ? 'bg-forest-100/60' : ''
                    } ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} ${
                      tree.isSuspected ? 'bg-amber-50/40' : ''
                    } ${
                      brushSelection && !isInBrush ? 'opacity-35 grayscale-[30%]' : ''
                    } ${
                      brushSelection && isInBrush
                        ? 'ring-0 ring-inset'
                        : ''
                    }`}
                    style={
                      isChecked && color
                        ? {
                            borderLeftWidth: 4,
                            borderLeftColor: color,
                            backgroundColor: selectedTreeId === tree.treeId
                              ? undefined
                              : `color-mix(in srgb, ${color} 6%, white)`,
                          }
                        : undefined
                    }
                  >
                    <td className="table-cell text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => handleCheckboxClick(e, tree)}
                        disabled={isDisabled}
                        className={`inline-flex items-center justify-center transition-all ${
                          isDisabled
                            ? 'opacity-40 cursor-not-allowed'
                            : 'hover:scale-110 cursor-pointer'
                        }`}
                        title={
                          !canCompare
                            ? '观测不足2次，无法加入对比集'
                            : isChecked
                            ? '移出对比集'
                            : '加入对比集'
                        }
                      >
                        {isChecked ? (
                          <CheckSquare
                            className="w-5 h-5"
                            style={{ color: color || '#1B4332' }}
                          />
                        ) : (
                          <Square
                            className={`w-5 h-5 ${
                              canCompare ? 'text-gray-300' : 'text-gray-200'
                            }`}
                          />
                        )}
                      </button>
                    </td>
                    <td className="table-cell">
                      {tree.isSuspected ? (
                        <AlertCircle className="w-5 h-5 text-amber-500 animate-pulse-slow" />
                      ) : isNaN(tree.correlationCoefficient) ? (
                        <HelpCircle className="w-5 h-5 text-gray-400" />
                      ) : (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      )}
                    </td>
                    <td className="table-cell">
                      <span className="flex items-center gap-2">
                        {isChecked && color && (
                          <span
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: color }}
                          />
                        )}
                        <span className="font-mono font-medium text-forest-700">
                          {tree.treeId}
                        </span>
                      </span>
                    </td>
                    <td className="table-cell">{tree.species}</td>
                    <td className="table-cell">{tree.street}</td>
                    <td className="table-cell text-right">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-sm ${getCorrelationColor(
                          tree.correlationCoefficient
                        )} ${getCorrelationBg(tree.correlationCoefficient)}`}
                      >
                        {formatValue(tree.correlationCoefficient)}
                      </span>
                    </td>
                    <td className="table-cell text-right">
                      <span
                        className={`font-mono ${
                          !canCompare ? 'text-gray-400' : ''
                        }`}
                      >
                        {tree.observationCount}
                        {!canCompare && (
                          <span
                            className="ml-1 text-xs text-gray-400"
                            title="观测不足2次，无法加入对比"
                          >
                            ⚠
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="table-cell text-right font-mono">
                      {formatValue(tree.firstTiltAngle)} 分
                    </td>
                    <td className="table-cell text-right font-mono">
                      {formatValue(tree.lastTiltAngle)} 分
                    </td>
                    <td className="table-cell text-right">
                      <span
                        className={`font-mono ${
                          tree.tiltAngleIncrease > 1.2
                            ? 'text-red-600 font-bold'
                            : tree.tiltAngleIncrease > 0
                            ? 'text-orange-500'
                            : 'text-green-600'
                        }`}
                      >
                        {tree.tiltAngleIncrease > 0 ? '+' : ''}
                        {formatValue(tree.tiltAngleIncrease)} 分
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        {selectedTree && (
          <div className="p-4 bg-forest-50 rounded-lg border border-forest-100 flex-1">
            <p className="text-sm text-forest-700">
              已选中 <strong>{selectedTree.treeId}</strong>（{selectedTree.species}
              ），上方散点图展示其张力-倾斜角分布关系。
              <span className="block mt-1 text-xs text-forest-600/80">
                💡 再次点击已选行可快速加入/移出对比集
              </span>
            </p>
          </div>
        )}
        {comparisonSet.length > 0 && (
          <div className="p-4 bg-gradient-to-r from-forest-50 to-emerald-50 rounded-lg border border-forest-200 flex-1 max-w-md">
            <p className="text-sm text-forest-700 font-medium mb-2">
              当前对比集 ({comparisonSet.length}/3):
            </p>
            <div className="flex flex-wrap gap-1.5">
              {comparisonSet.map((treeId) => {
                const t = trees.find((x) => x.treeId === treeId);
                const color = getTreeColor(treeId);
                return t ? (
                  <span
                    key={treeId}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border"
                    style={{
                      backgroundColor: `color-mix(in srgb, ${color} 10%, white)`,
                      borderColor: `color-mix(in srgb, ${color} 30%, transparent)`,
                      color,
                    }}
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    {treeId} · {t.species}
                  </span>
                ) : null;
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
