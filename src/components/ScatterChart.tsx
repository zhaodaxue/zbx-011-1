import { useMemo, useRef, useEffect, useCallback } from 'react';
import ReactECharts from 'echarts-for-react';
import { Info, X, Eraser, Layers } from 'lucide-react';
import {
  useAnalysisStore,
  selectSelectedTree,
  selectComparisonTrees,
  TREE_COLORS,
} from '../store/useAnalysisStore';
import type { EChartsOption, ECharts } from 'echarts';
import type { TreeAnalysis } from '../../shared/types';

function computeTrendLine(observations: { tension: number; tiltAngle: number }[]) {
  if (observations.length < 2) return null;
  const xValues = observations.map((o) => o.tension);
  const yValues = observations.map((o) => o.tiltAngle);
  const n = xValues.length;
  const sumX = xValues.reduce((a, b) => a + b, 0);
  const sumY = yValues.reduce((a, b) => a + b, 0);
  const sumXY = xValues.reduce((acc, x, i) => acc + x * yValues[i], 0);
  const sumX2 = xValues.reduce((acc, x) => acc + x * x, 0);
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX || 1);
  const intercept = (sumY - slope * sumX) / n;
  const minX = Math.min(...xValues);
  const maxX = Math.max(...xValues);
  return {
    slope,
    intercept,
    lineData: [
      [minX - 1, slope * (minX - 1) + intercept],
      [maxX + 1, slope * (maxX + 1) + intercept],
    ],
  };
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function ScatterChart() {
  const {
    analysisData,
    selectedTreeId,
    setSelectedTreeId,
    comparisonSet,
    hiddenTrees,
    brushSelection,
    setBrushSelection,
    clearBrushSelection,
    clearComparisonSet,
    toggleTreeVisibility,
    getTreeColor,
  } = useAnalysisStore();
  const selectedTree = useAnalysisStore(selectSelectedTree);
  const comparisonTrees = useAnalysisStore(selectComparisonTrees);
  const chartRef = useRef<ReactECharts | null>(null);

  const trees = analysisData?.trees ?? [];
  const treeOptions = trees.map((t) => ({
    value: t.treeId,
    label: `${t.treeId} - ${t.species}`,
  }));

  const handleEvents = useCallback(
    () => ({
      brushEnd: (params: any) => {
        if (!params.areas || params.areas.length === 0) {
          clearBrushSelection();
          return;
        }
        const area = params.areas[0];
        if (area.coordRange) {
          const [[minX, maxX], [minY, maxY]] = area.coordRange;
          if (Math.abs(maxX - minX) < 0.1 || Math.abs(maxY - minY) < 0.1) {
            clearBrushSelection();
            return;
          }
          setBrushSelection({ minX, maxX, minY, maxY });
        }
      },
      legendselectchanged: (params: any) => {
        const selected = params.selected as Record<string, boolean>;
        comparisonTrees.forEach((tree) => {
          const legendName = `${tree.treeId} 观测`;
          if (selected[legendName] !== undefined) {
            const shouldHide = !selected[legendName];
            const isCurrentlyHidden = hiddenTrees.includes(tree.treeId);
            if (shouldHide !== isCurrentlyHidden) {
              toggleTreeVisibility(tree.treeId);
            }
          }
        });
      },
    }),
    [comparisonTrees, hiddenTrees, setBrushSelection, clearBrushSelection, toggleTreeVisibility]
  );

  const option = useMemo((): EChartsOption => {
    const effectiveTrees: TreeAnalysis[] = [];
    if (comparisonSet.length > 0) {
      effectiveTrees.push(...comparisonTrees.filter((t) => t.observations.length >= 2));
    } else if (selectedTree && selectedTree.observations.length >= 2) {
      effectiveTrees.push(selectedTree);
    }

    if (effectiveTrees.length === 0) {
      const msg =
        comparisonSet.length > 0
          ? '对比集中的古树观测数据不足，无法绘制散点图'
          : selectedTree && selectedTree.observations.length < 2
          ? '观测数据不足，无法绘制散点图（至少需要2次观测）'
          : '请在表格中勾选或点击古树加入对比集查看散点图';
      return {
        title: {
          text: msg,
          left: 'center',
          top: 'center',
          textStyle: { color: '#9ca3af', fontSize: 16, fontWeight: 'normal' },
        },
      };
    }

    const series: any[] = [];
    const legendData: { name: string; itemStyle: { color: string } }[] = [];
    let allMinX = Infinity,
      allMaxX = -Infinity,
      allMinY = Infinity,
      allMaxY = -Infinity;

    effectiveTrees.forEach((tree) => {
      const color = getTreeColor(tree.treeId);
      const isHidden = hiddenTrees.includes(tree.treeId);
      const observations = tree.observations;
      const scatterData = observations.map((o) => [o.tension, o.tiltAngle]);

      observations.forEach((o) => {
        allMinX = Math.min(allMinX, o.tension);
        allMaxX = Math.max(allMaxX, o.tension);
        allMinY = Math.min(allMinY, o.tiltAngle);
        allMaxY = Math.max(allMaxY, o.tiltAngle);
      });

      const trend = computeTrendLine(observations);
      const legendName = `${tree.treeId} 观测`;
      const trendLegendName = `${tree.treeId} 趋势`;

      legendData.push({ name: legendName, itemStyle: { color } });

      series.push({
        name: legendName,
        type: 'scatter',
        data: scatterData,
        symbolSize: 12,
        itemStyle: {
          color,
          opacity: isHidden ? 0 : 0.85,
          borderColor: '#fff',
          borderWidth: 2,
          shadowBlur: 8,
          shadowColor: hexToRgba(color, 0.3),
        },
        emphasis: {
          itemStyle: {
            opacity: 1,
            shadowBlur: 15,
          },
        },
        z: 3,
      });

      if (trend) {
        series.push({
          name: trendLegendName,
          type: 'line',
          data: trend.lineData,
          lineStyle: {
            color,
            type: 'dashed',
            width: 2.5,
            opacity: isHidden ? 0 : 0.8,
          },
          symbol: 'none',
          silent: true,
          z: 2,
        });
      }
    });

    const padding = 1;
    allMinX = Math.floor(allMinX - padding);
    allMaxX = Math.ceil(allMaxX + padding);
    allMinY = Math.floor(allMinY - padding);
    allMaxY = Math.ceil(allMaxY + padding);

    const brushAreas: any[] = [];
    if (brushSelection) {
      brushAreas.push({
        type: 'rect',
        coordRange: [
          [brushSelection.minX, brushSelection.maxX],
          [brushSelection.minY, brushSelection.maxY],
        ],
        itemStyle: {
          color: 'rgba(53, 95, 85, 0.12)',
          borderColor: '#355f55',
          borderWidth: 2,
          borderType: 'dashed',
        },
      });
    }

    const titleText =
      comparisonSet.length > 0
        ? `多树对比分析 (${comparisonSet.length}/3)`
        : `${selectedTree?.treeId} - ${selectedTree?.species}`;
    const subText =
      comparisonSet.length > 0
        ? `已选 ${effectiveTrees.length} 棵古树 · 点击图例可隐藏/显示 · 在图中拖拽可框选`
        : `相关系数: ${
            selectedTree && Number.isFinite(selectedTree.correlationCoefficient)
              ? selectedTree.correlationCoefficient.toFixed(3)
              : '—'
          } | 观测次数: ${selectedTree?.observationCount ?? 0} | 勾选表格可加入对比`;
    const hasSuspect = effectiveTrees.some((t) => t.isSuspected);

    return {
      backgroundColor: 'transparent',
      animation: true,
      grid: {
        left: 60,
        right: 30,
        top: 130,
        bottom: 60,
      },
      title: {
        text: titleText,
        subtext: subText,
        left: 'center',
        top: 10,
        textStyle: {
          color: '#1B4332',
          fontSize: 18,
          fontWeight: 600,
          fontFamily: '"Noto Serif SC", serif',
        },
        subtextStyle: {
          color: hasSuspect ? '#dc2626' : '#64748b',
          fontSize: 13,
        },
      },
      legend: {
        type: 'scroll',
        top: 65,
        left: 'center',
        data: legendData,
        selected: legendData.reduce((acc, item) => {
          const treeId = item.name.split(' ')[0];
          acc[item.name] = !hiddenTrees.includes(treeId);
          return acc;
        }, {} as Record<string, boolean>),
        textStyle: {
          color: '#475569',
          fontSize: 12,
        },
        itemGap: 16,
        icon: 'circle',
      },
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          if (params.seriesType === 'line') {
            return '';
          }
          const treeId = params.seriesName.split(' ')[0];
          const tree = effectiveTrees.find((t) => t.treeId === treeId);
          if (!tree) return '';
          const idx = params.dataIndex;
          const obs = tree.observations[idx];
          if (!obs) return '';
          const color = getTreeColor(treeId);
          return `
            <div style="padding: 4px 0;">
              <div style="font-weight: 600; margin-bottom: 6px; color: ${color};">
                ${tree.treeId} - ${tree.species}
              </div>
              <div style="margin-bottom: 2px;">${obs.observationDate}</div>
              <div>支撑索张力: <strong>${obs.tension.toFixed(2)} kN</strong></div>
              <div>倾斜角: <strong>${obs.tiltAngle.toFixed(2)} 分</strong></div>
            </div>
          `;
        },
        backgroundColor: 'rgba(255, 255, 255, 0.97)',
        borderColor: '#d1d5db',
        borderWidth: 1,
        textStyle: { color: '#1f2937' },
        extraCssText: 'box-shadow: 0 4px 12px rgba(0,0,0,0.1); border-radius: 8px;',
      },
      xAxis: {
        name: '支撑索张力 (千牛)',
        nameLocation: 'middle',
        nameGap: 30,
        nameTextStyle: { color: '#475569', fontSize: 13 },
        type: 'value',
        min: allMinX,
        max: allMaxX,
        axisLabel: { color: '#64748b', fontSize: 12 },
        axisLine: { lineStyle: { color: '#e2e8f0' } },
        splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
      },
      yAxis: {
        name: '倾斜角 (分)',
        nameLocation: 'middle',
        nameGap: 40,
        nameTextStyle: { color: '#475569', fontSize: 13 },
        type: 'value',
        min: allMinY,
        max: allMaxY,
        axisLabel: { color: '#64748b', fontSize: 12 },
        axisLine: { lineStyle: { color: '#e2e8f0' } },
        splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
      },
      brush: {
        toolbox: ['rect', 'clear'],
        brushLink: 'all',
        throttleType: 'debounce',
        throttleDelay: 300,
        xAxisIndex: 0,
        yAxisIndex: 0,
        brushStyle: {
          color: 'rgba(53, 95, 85, 0.12)',
          borderColor: '#355f55',
          borderWidth: 2,
        },
      } as any,
      series,
    };
  }, [comparisonSet, comparisonTrees, selectedTree, hiddenTrees, brushSelection, getTreeColor]);

  useEffect(() => {
    const chart = chartRef.current?.getEchartsInstance() as ECharts | undefined;
    if (!chart || !brushSelection) return;
    chart.dispatchAction({
      type: 'brush',
      areas: [
        {
          type: 'rect',
          coordRange: [
            [brushSelection.minX, brushSelection.maxX],
            [brushSelection.minY, brushSelection.maxY],
          ],
        },
      ],
    });
  }, [brushSelection, chartRef.current]);

  return (
    <div className="card animate-stagger" style={{ animationDelay: '0.8s' }}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-forest-800 font-serif">
            张力-倾斜角散点图
          </h2>
          <div className="group relative">
            <Info className="w-4 h-4 text-gray-400 cursor-help" />
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 p-3 bg-gray-800 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
              横轴为支撑索张力，纵轴为树身倾斜角。
              <br />
              负相关表示张力越小，倾斜角越大，可能存在索力失效风险。
              <br />
              <strong className="text-forest-300">提示:</strong> 拖拽图中区域可框选联动表格
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {comparisonSet.length > 0 && (
            <>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-forest-50 rounded-lg border border-forest-200">
                <Layers className="w-4 h-4 text-forest-600" />
                <span className="text-sm text-forest-700 font-medium">
                  对比集 {comparisonSet.length}/3
                </span>
              </div>
              <button
                onClick={clearBrushSelection}
                disabled={!brushSelection}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="清除框选"
              >
                <Eraser className="w-4 h-4" />
                <span>清除框选</span>
              </button>
              <button
                onClick={clearComparisonSet}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors"
                title="清空对比集"
              >
                <X className="w-4 h-4" />
                <span>清空对比</span>
              </button>
            </>
          )}

          <div className="relative">
            <select
              value={selectedTreeId || ''}
              onChange={(e) => setSelectedTreeId(e.target.value)}
              className="appearance-none input-field pr-10 cursor-pointer bg-white text-sm"
              style={{ minWidth: 180 }}
            >
              <option value="" disabled>
                主选古树
              </option>
              {treeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {comparisonSet.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {comparisonTrees.map((tree) => {
            const color = getTreeColor(tree.treeId);
            const isHidden = hiddenTrees.includes(tree.treeId);
            return (
              <div
                key={tree.treeId}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm border-2 transition-all ${
                  isHidden
                    ? 'bg-gray-50 border-gray-200 opacity-60'
                    : 'border-transparent'
                }`}
                style={{
                  backgroundColor: isHidden ? undefined : hexToRgba(color, 0.08),
                  borderColor: isHidden ? undefined : hexToRgba(color, 0.3),
                }}
              >
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span className="font-medium" style={{ color }}>
                  {tree.treeId}
                </span>
                <span className="text-gray-600 text-xs">{tree.species}</span>
                <button
                  onClick={() => toggleTreeVisibility(tree.treeId)}
                  className="ml-1 text-gray-400 hover:text-gray-700 transition-colors"
                  title={isHidden ? '显示' : '隐藏'}
                >
                  {isHidden ? '👁‍🗨' : '👁'}
                </button>
                <button
                  onClick={() => {
                    useAnalysisStore.getState().removeFromComparisonSet(tree.treeId);
                  }}
                  className="ml-0.5 text-gray-400 hover:text-red-500 transition-colors"
                  title="移出对比集"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div className="h-96 bg-gradient-to-br from-forest-50/50 to-white rounded-lg border border-forest-100">
        <ReactECharts
          ref={chartRef}
          option={option}
          style={{ height: '100%', width: '100%' }}
          notMerge={true}
          lazyUpdate={true}
          opts={{ renderer: 'canvas' }}
          onEvents={handleEvents()}
        />
      </div>

      {brushSelection && (
        <div className="mt-4 p-3 bg-forest-50 rounded-lg border border-forest-200 flex items-center justify-between">
          <div className="text-sm text-forest-700">
            <strong>框选范围:</strong> 张力{' '}
            <span className="font-mono">
              {brushSelection.minX.toFixed(1)} ~ {brushSelection.maxX.toFixed(1)} kN
            </span>
            ，倾斜角{' '}
            <span className="font-mono">
              {brushSelection.minY.toFixed(1)} ~ {brushSelection.maxY.toFixed(1)} 分
            </span>
          </div>
          <button
            onClick={clearBrushSelection}
            className="text-xs px-3 py-1 bg-white border border-forest-300 rounded-md hover:bg-forest-100 text-forest-700 transition-colors"
          >
            取消框选
          </button>
        </div>
      )}

      {comparisonSet.length === 0 && selectedTree && (
        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          <div className="px-3 py-1.5 bg-gray-50 rounded-lg">
            <span className="text-gray-500">首次倾斜角:</span>{' '}
            <span className="font-mono font-medium">
              {selectedTree.firstTiltAngle.toFixed(2)} 分
            </span>
          </div>
          <div className="px-3 py-1.5 bg-gray-50 rounded-lg">
            <span className="text-gray-500">末次倾斜角:</span>{' '}
            <span className="font-mono font-medium">
              {selectedTree.lastTiltAngle.toFixed(2)} 分
            </span>
          </div>
          <div className="px-3 py-1.5 bg-gray-50 rounded-lg">
            <span className="text-gray-500">倾斜角增量:</span>{' '}
            <span
              className={`font-mono font-medium ${
                selectedTree.tiltAngleIncrease > 1.2
                  ? 'text-red-600'
                  : selectedTree.tiltAngleIncrease > 0
                  ? 'text-orange-500'
                  : 'text-green-600'
              }`}
            >
              {selectedTree.tiltAngleIncrease > 0 ? '+' : ''}
              {selectedTree.tiltAngleIncrease.toFixed(2)} 分
            </span>
          </div>
        </div>
      )}

      {comparisonSet.length > 0 && (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {comparisonTrees.map((tree) => {
            const color = getTreeColor(tree.treeId);
            return (
              <div
                key={tree.treeId}
                className="p-3 rounded-lg border border-gray-100 bg-gray-50/50"
                style={{ borderLeftColor: color, borderLeftWidth: 4 }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className="font-semibold text-sm"
                    style={{ color }}
                  >
                    {tree.treeId} · {tree.species}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      tree.isSuspected
                        ? 'bg-red-100 text-red-700'
                        : 'bg-green-100 text-green-700'
                    }`}
                  >
                    r = {tree.correlationCoefficient.toFixed(2)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-500">观测:</span>{' '}
                    <span className="font-mono">{tree.observationCount}次</span>
                  </div>
                  <div>
                    <span className="text-gray-500">增量:</span>{' '}
                    <span
                      className={`font-mono ${
                        tree.tiltAngleIncrease > 1.2
                          ? 'text-red-600 font-semibold'
                          : tree.tiltAngleIncrease > 0
                          ? 'text-orange-500'
                          : 'text-green-600'
                      }`}
                    >
                      {tree.tiltAngleIncrease > 0 ? '+' : ''}
                      {tree.tiltAngleIncrease.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
