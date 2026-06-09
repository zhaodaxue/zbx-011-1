import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { ChevronDown, Info } from 'lucide-react';
import { useAnalysisStore, selectSelectedTree } from '../store/useAnalysisStore';
import type { EChartsOption } from 'echarts';

export function ScatterChart() {
  const { analysisData, selectedTreeId, setSelectedTreeId } = useAnalysisStore();
  const selectedTree = useAnalysisStore(selectSelectedTree);

  const trees = analysisData?.trees ?? [];
  const treeOptions = trees.map((t) => ({
    value: t.treeId,
    label: `${t.treeId} - ${t.species}`,
  }));

  const option = useMemo((): EChartsOption => {
    if (!selectedTree || selectedTree.observations.length < 2) {
      return {
        title: {
          text:
            selectedTree && selectedTree.observations.length < 2
              ? '观测数据不足，无法绘制散点图（至少需要2次观测）'
              : '请选择一棵古树查看散点图',
          left: 'center',
          top: 'center',
          textStyle: { color: '#9ca3af', fontSize: 16, fontWeight: 'normal' },
        },
      };
    }

    const observations = selectedTree.observations;
    const scatterData = observations.map((o) => [o.tension, o.tiltAngle]);

    const xValues = observations.map((o) => o.tension);
    const yValues = observations.map((o) => o.tiltAngle);

    const n = xValues.length;
    const sumX = xValues.reduce((a, b) => a + b, 0);
    const sumY = yValues.reduce((a, b) => a + b, 0);
    const sumXY = xValues.reduce((acc, x, i) => acc + x * yValues[i], 0);
    const sumX2 = xValues.reduce((acc, x) => acc + x * x, 0);

    const slope =
      (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX || 1);
    const intercept = (sumY - slope * sumX) / n;

    const minX = Math.min(...xValues);
    const maxX = Math.max(...xValues);
    const lineData = [
      [minX - 1, slope * (minX - 1) + intercept],
      [maxX + 1, slope * (maxX + 1) + intercept],
    ];

    const isSuspected = selectedTree.isSuspected;

    return {
      backgroundColor: 'transparent',
      grid: {
        left: 60,
        right: 30,
        top: 80,
        bottom: 60,
      },
      title: {
        text: `${selectedTree.treeId} - ${selectedTree.species}`,
        subtext: `相关系数: ${Number.isFinite(selectedTree.correlationCoefficient) ? selectedTree.correlationCoefficient.toFixed(3) : '—'} | 观测次数: ${selectedTree.observationCount}`,
        left: 'center',
        textStyle: {
          color: '#1B4332',
          fontSize: 18,
          fontWeight: 600,
          fontFamily: '"Noto Serif SC", serif',
        },
        subtextStyle: {
          color: isSuspected ? '#dc2626' : '#64748b',
          fontSize: 13,
        },
      },
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          if (params.seriesType === 'line') {
            return `趋势线<br/>y = ${slope.toFixed(4)}x + ${intercept.toFixed(4)}`;
          }
          const idx = params.dataIndex;
          const obs = observations[idx];
          return `
            <div style="font-weight: 600; margin-bottom: 4px;">${obs.observationDate}</div>
            <div>支撑索张力: <strong>${obs.tension.toFixed(2)} kN</strong></div>
            <div>倾斜角: <strong>${obs.tiltAngle.toFixed(2)} 分</strong></div>
          `;
        },
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#d1d5db',
        borderWidth: 1,
        textStyle: { color: '#1f2937' },
      },
      xAxis: {
        name: '支撑索张力 (千牛)',
        nameLocation: 'middle',
        nameGap: 30,
        nameTextStyle: { color: '#475569', fontSize: 13 },
        type: 'value',
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
        axisLabel: { color: '#64748b', fontSize: 12 },
        axisLine: { lineStyle: { color: '#e2e8f0' } },
        splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
      },
      series: [
        {
          name: '观测数据',
          type: 'scatter',
          data: scatterData,
          symbolSize: 12,
          itemStyle: {
            color: isSuspected ? '#dc2626' : '#1B4332',
            opacity: 0.8,
            borderColor: '#fff',
            borderWidth: 2,
            shadowBlur: 10,
            shadowColor: isSuspected
              ? 'rgba(220, 38, 38, 0.3)'
              : 'rgba(27, 67, 50, 0.2)',
          },
          emphasis: {
            itemStyle: {
              color: isSuspected ? '#ef4444' : '#284a42',
              opacity: 1,
              shadowBlur: 15,
            },
          },
        },
        {
          name: '趋势线',
          type: 'line',
          data: lineData,
          lineStyle: {
            color: isSuspected ? '#f87171' : '#52796F',
            type: 'dashed',
            width: 2,
          },
          symbol: 'none',
          silent: false,
        },
      ],
    };
  }, [selectedTree]);

  return (
    <div className="card animate-stagger" style={{ animationDelay: '0.8s' }}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-forest-800 font-serif">
            张力-倾斜角散点图
          </h2>
          <div className="group relative">
            <Info className="w-4 h-4 text-gray-400 cursor-help" />
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-gray-800 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
              横轴为支撑索张力，纵轴为树身倾斜角。
              <br />
              负相关表示张力越小，倾斜角越大，可能存在索力失效风险。
            </div>
          </div>
        </div>

        <div className="relative">
          <select
            value={selectedTreeId || ''}
            onChange={(e) => setSelectedTreeId(e.target.value)}
            className="appearance-none input-field pr-10 cursor-pointer bg-white text-sm"
            style={{ minWidth: 200 }}
          >
            <option value="" disabled>
              请选择古树
            </option>
            {treeOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      <div className="h-96 bg-gradient-to-br from-forest-50/50 to-white rounded-lg border border-forest-100">
        <ReactECharts
          option={option}
          style={{ height: '100%', width: '100%' }}
          notMerge={true}
          lazyUpdate={true}
          opts={{ renderer: 'canvas' }}
        />
      </div>

      {selectedTree && (
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
    </div>
  );
}
