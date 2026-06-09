import { AlertCircle, CheckCircle, HelpCircle } from 'lucide-react';
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
  const { analysisData, loading, selectedTreeId, setSelectedTreeId } =
    useAnalysisStore();
  const selectedTree = useAnalysisStore(selectSelectedTree);

  const trees = analysisData?.trees ?? [];

  const handleRowClick = (tree: TreeAnalysis) => {
    setSelectedTreeId(tree.treeId);
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
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-forest-800 font-serif">
          各古树相关系数排序
        </h2>
        <div className="flex items-center gap-4 text-xs text-gray-500">
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
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-100">
        <table className="w-full">
          <thead>
            <tr>
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
                <td colSpan={9} className="table-cell text-center py-8 text-gray-400">
                  暂无数据
                </td>
              </tr>
            ) : (
              trees.map((tree, idx) => (
                <tr
                  key={tree.treeId}
                  onClick={() => handleRowClick(tree)}
                  className={`cursor-pointer transition-colors hover:bg-forest-50 ${
                    selectedTreeId === tree.treeId ? 'bg-forest-100/50' : ''
                  } ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} ${
                    tree.isSuspected ? 'bg-amber-50/50' : ''
                  }`}
                >
                  <td className="table-cell">
                    {tree.isSuspected ? (
                      <AlertCircle className="w-5 h-5 text-amber-500 animate-pulse-slow" />
                    ) : isNaN(tree.correlationCoefficient) ? (
                      <HelpCircle className="w-5 h-5 text-gray-400" />
                    ) : (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                  </td>
                  <td className="table-cell font-mono font-medium text-forest-700">
                    {tree.treeId}
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
                  <td className="table-cell text-right font-mono">
                    {tree.observationCount}
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
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedTree && (
        <div className="mt-4 p-4 bg-forest-50 rounded-lg border border-forest-100">
          <p className="text-sm text-forest-700">
            已选中 <strong>{selectedTree.treeId}</strong>（{selectedTree.species}
            ），右侧散点图展示其张力-倾斜角分布关系。
          </p>
        </div>
      )}
    </div>
  );
}
