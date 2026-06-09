import { Trees, FileText, AlertTriangle, TrendingDown } from 'lucide-react';
import { useAnalysisStore } from '../store/useAnalysisStore';

export function StatsCards() {
  const { analysisData, loading } = useAnalysisStore();
  const stats = analysisData?.statistics;

  const cards = [
    {
      label: '古树总数',
      value: stats?.totalTrees ?? 0,
      unit: '棵',
      icon: Trees,
      color: 'from-forest-500 to-forest-700',
      delay: '0.2s',
    },
    {
      label: '观测记录',
      value: stats?.totalObservations ?? 0,
      unit: '条',
      icon: FileText,
      color: 'from-blue-500 to-blue-700',
      delay: '0.3s',
    },
    {
      label: '嫌疑古树',
      value: stats?.suspectedCount ?? 0,
      unit: '棵',
      icon: AlertTriangle,
      color: 'from-amber-500 to-amber-600',
      delay: '0.4s',
    },
    {
      label: '平均相关系数',
      value: stats?.avgCorrelation ?? 0,
      unit: '',
      icon: TrendingDown,
      color: 'from-emerald-500 to-emerald-700',
      delay: '0.5s',
      format: (v: number) => v.toFixed(3),
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => (
        <div
          key={idx}
          className="card card-hover animate-stagger relative overflow-hidden"
          style={{ animationDelay: card.delay }}
        >
          <div
            className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${card.color}`}
          />
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">{card.label}</p>
              <p className="text-3xl font-bold text-gray-800">
                {loading ? (
                  <span className="inline-block w-20 h-9 bg-gray-200 animate-pulse rounded" />
                ) : (
                  <>
                    {card.format ? card.format(card.value as number) : card.value}
                    <span className="text-lg font-normal text-gray-400 ml-1">
                      {card.unit}
                    </span>
                  </>
                )}
              </p>
            </div>
            <div
              className={`p-3 rounded-xl bg-gradient-to-br ${card.color} bg-opacity-10`}
            >
              <card.icon className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
