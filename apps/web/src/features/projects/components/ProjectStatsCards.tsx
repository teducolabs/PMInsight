import { useQuery } from '@tanstack/react-query';
import { projectApi } from '../api';
import { Card, CardContent } from '@/components/ui/card';
import { FolderKanban, Activity, CheckCircle2, PauseCircle, AlertCircle } from 'lucide-react';

export function ProjectStatsCards() {
  const { data: stats } = useQuery({
    queryKey: ['project-stats'],
    queryFn: projectApi.getStats,
  });

  const cards = [
    {
      title: 'Tổng số dự án',
      value: stats?.totalProjects || 0,
      icon: FolderKanban,
      color: 'blue',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      title: 'Đang thực hiện',
      value: stats?.activeProjects || 0,
      icon: Activity,
      color: 'green',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
    },
    {
      title: 'Hoàn thành',
      value: stats?.completedProjects || 0,
      icon: CheckCircle2,
      color: 'gray',
      bgColor: 'bg-gray-50',
      iconColor: 'text-gray-600',
    },
    {
      title: 'Tạm dừng',
      value: stats?.onHoldProjects || 0,
      icon: PauseCircle,
      color: 'orange',
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600',
    },
  ];

  const healthCards = [
    {
      title: 'Critical (Red)',
      value: stats?.redProjects || 0,
      bgColor: 'bg-red-50',
      textColor: 'text-red-700',
      dotColor: 'bg-red-500',
    },
    {
      title: 'At Risk (Yellow)',
      value: stats?.yellowProjects || 0,
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-700',
      dotColor: 'bg-yellow-500',
    },
    {
      title: 'On Track (Green)',
      value: stats?.greenProjects || 0,
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
      dotColor: 'bg-green-500',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Main Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title} className="border-l-4 border-l-transparent hover:border-l-blue-500 transition-all">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{card.title}</p>
                    <p className="mt-2 text-3xl font-bold text-gray-900">{card.value}</p>
                  </div>
                  <div className={`rounded-full ${card.bgColor} p-3`}>
                    <Icon className={`h-6 w-6 ${card.iconColor}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Health Status */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-gray-600" />
              <h3 className="font-semibold text-gray-900">Project Health Status</h3>
              <span className="text-xs text-gray-500">(RAG Status)</span>
            </div>
            <div className="flex items-center gap-6">
              {healthCards.map((card) => (
                <div key={card.title} className={`flex items-center gap-2 rounded-lg ${card.bgColor} px-4 py-2`}>
                  <div className={`h-3 w-3 rounded-full ${card.dotColor}`} />
                  <div>
                    <p className="text-xs text-gray-600">{card.title}</p>
                    <p className={`text-xl font-bold ${card.textColor}`}>{card.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

