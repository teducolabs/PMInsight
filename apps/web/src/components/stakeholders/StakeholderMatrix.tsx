import { useQuery } from '@tanstack/react-query';
import { stakeholderApi } from '@/lib/api/stakeholder';
import { Stakeholder } from '@/types/stakeholder';

interface StakeholderMatrixProps {
  projectId: string;
}

export function StakeholderMatrix({ projectId }: StakeholderMatrixProps) {
  const { data: stakeholders, isLoading } = useQuery({
    queryKey: ['stakeholders', projectId],
    queryFn: () => stakeholderApi.getByProject(projectId),
  });

  if (isLoading) {
    return <div>Đang tải...</div>;
  }

  const getQuadrant = (influence: number, interest: number) => {
    if (influence >= 3 && interest >= 3) return 'manage-closely';
    if (influence >= 3 && interest < 3) return 'keep-satisfied';
    if (influence < 3 && interest >= 3) return 'keep-informed';
    return 'monitor';
  };

  const getPosition = (influence: number, interest: number) => {
    // Map 1-5 to grid position (0-100%)
    const x = ((interest - 1) / 4) * 100;
    const y = ((5 - influence) / 4) * 100; // Invert Y axis
    return { x, y };
  };

  return (
    <div className="space-y-4">
      {/* Matrix Legend */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border-2 border-red-300 bg-red-50 p-4">
          <h3 className="font-semibold text-red-900">Manage Closely</h3>
          <p className="text-sm text-red-700">High Influence, High Interest</p>
          <p className="text-xs text-red-600 mt-1">Quản lý chặt chẽ, giao tiếp thường xuyên</p>
        </div>
        <div className="rounded-lg border-2 border-orange-300 bg-orange-50 p-4">
          <h3 className="font-semibold text-orange-900">Keep Satisfied</h3>
          <p className="text-sm text-orange-700">High Influence, Low Interest</p>
          <p className="text-xs text-orange-600 mt-1">Giữ hài lòng, cập nhật định kỳ</p>
        </div>
        <div className="rounded-lg border-2 border-blue-300 bg-blue-50 p-4">
          <h3 className="font-semibold text-blue-900">Keep Informed</h3>
          <p className="text-sm text-blue-700">Low Influence, High Interest</p>
          <p className="text-xs text-blue-600 mt-1">Thông tin đầy đủ, tránh vấn đề</p>
        </div>
        <div className="rounded-lg border-2 border-gray-300 bg-gray-50 p-4">
          <h3 className="font-semibold text-gray-900">Monitor</h3>
          <p className="text-sm text-gray-700">Low Influence, Low Interest</p>
          <p className="text-xs text-gray-600 mt-1">Theo dõi, thông tin tối thiểu</p>
        </div>
      </div>

      {/* Matrix Chart */}
      <div className="rounded-lg border bg-white p-6">
        <div className="relative h-[600px] w-full">
          {/* Grid background */}
          <div className="absolute inset-0 grid grid-cols-5 grid-rows-5 gap-0.5">
            {Array.from({ length: 25 }).map((_, i) => {
              const row = Math.floor(i / 5);
              const col = i % 5;
              let bgColor = 'bg-gray-50';
              
              if (row < 2 && col >= 3) bgColor = 'bg-orange-50';
              else if (row < 2 && col < 3) bgColor = 'bg-red-50';
              else if (row >= 2 && col >= 3) bgColor = 'bg-gray-50';
              else bgColor = 'bg-blue-50';
              
              return <div key={i} className={`${bgColor} border border-gray-200`} />;
            })}
          </div>

          {/* Axis labels */}
          <div className="absolute -left-20 top-0 flex h-full flex-col justify-between py-4 text-sm font-medium text-gray-600">
            <span>Very High (5)</span>
            <span>High (4)</span>
            <span>Medium (3)</span>
            <span>Low (2)</span>
            <span>Very Low (1)</span>
          </div>
          <div className="absolute -bottom-10 left-0 flex w-full justify-between px-4 text-sm font-medium text-gray-600">
            <span>1</span>
            <span>2</span>
            <span>3</span>
            <span>4</span>
            <span>5</span>
          </div>

          {/* Axis titles */}
          <div className="absolute -left-32 top-1/2 -translate-y-1/2 -rotate-90 text-sm font-bold text-gray-700">
            INFLUENCE →
          </div>
          <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 text-sm font-bold text-gray-700">
            INTEREST →
          </div>

          {/* Stakeholder dots */}
          {stakeholders && stakeholders.map((stakeholder: Stakeholder) => {
            const { x, y } = getPosition(stakeholder.influence, stakeholder.interest);
            const quadrant = getQuadrant(stakeholder.influence, stakeholder.interest);
            
            let color = 'bg-gray-500';
            if (quadrant === 'manage-closely') color = 'bg-red-500';
            else if (quadrant === 'keep-satisfied') color = 'bg-orange-500';
            else if (quadrant === 'keep-informed') color = 'bg-blue-500';

            return (
              <div
                key={stakeholder.id}
                className="absolute group"
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <div className={`h-4 w-4 rounded-full ${color} cursor-pointer shadow-lg transition-transform hover:scale-150`} />
                <div className="absolute left-full top-0 ml-2 hidden group-hover:block whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white">
                  <div className="font-semibold">{stakeholder.name}</div>
                  <div className="text-gray-300">{stakeholder.role}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
