import { useState } from 'react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { FolderTree, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';

interface ProjectInfoBannerProps {
  projectName: string;
  startDate: Date;
  endDate: Date;
  currentPhase: string;
  progress: number;
}

export function ProjectInfoBanner({
  projectName,
  startDate,
  endDate,
  currentPhase,
  progress,
}: ProjectInfoBannerProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const today = new Date();
  const daysPassed = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const todayPercent = Math.max(0, Math.min(100, (daysPassed / totalDays) * 100));

  return (
    <div className="rounded-lg border bg-gradient-to-r from-blue-50 to-indigo-50">
      <div 
        className="p-6 cursor-pointer hover:bg-blue-100/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-gray-900">{projectName}</h2>
              {isExpanded ? (
                <ChevronUp className="w-5 h-5 text-blue-700" />
              ) : (
                <ChevronDown className="w-5 h-5 text-blue-700" />
              )}
            </div>
            {!isExpanded && (
              <div className="flex items-center gap-6 text-sm mt-2">
                <span className="text-gray-600">
                  {format(startDate, 'dd/MM/yyyy', { locale: vi })} - {format(endDate, 'dd/MM/yyyy', { locale: vi })}
                </span>
                <span className="text-gray-600">
                  Giai đoạn: <strong className="text-blue-700">{currentPhase}</strong>
                </span>
              </div>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="text-3xl font-bold text-blue-600">{progress}%</div>
            <div className="text-xs text-gray-500">Tiến độ tổng thể</div>
            <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
        
        {isExpanded && (
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <FolderTree className="w-4 h-4 text-blue-600" />
              <span className="text-gray-600">
                Từ <strong>{format(startDate, 'dd/MM/yyyy', { locale: vi })}</strong> đến{' '}
                <strong>{format(endDate, 'dd/MM/yyyy', { locale: vi })}</strong>
              </span>
              <span className="text-gray-400">({totalDays} ngày)</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-gray-600">
                Giai đoạn: <strong className="text-blue-700">{currentPhase}</strong>
              </span>
            </div>
          </div>
        )}
      </div>

      {isExpanded && (
        <div className="px-6 pb-6">
          {/* Timeline visualization */}
          <div className="relative">
            <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
              <span>{format(startDate, 'dd/MM/yyyy', { locale: vi })}</span>
              <div className="flex-1" />
              <span className="text-blue-600 font-semibold">
                Hôm nay: {format(new Date(), 'dd/MM/yyyy', { locale: vi })}
              </span>
              <div className="flex-1" />
              <span>{format(endDate, 'dd/MM/yyyy', { locale: vi })}</span>
            </div>

            {/* Timeline bar */}
            <div className="relative h-8 bg-gray-200 rounded-lg overflow-hidden">
              {/* Progress fill */}
              <div
                className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300"
                style={{ width: `${progress}%` }}
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse" />
              </div>

              {/* Today marker */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
                style={{ left: `${todayPercent}%` }}
              >
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-red-500 rounded-full border-2 border-white shadow-lg" />
              </div>
              <div
                className="absolute top-1/2 -translate-y-1/2 px-2 py-0.5 bg-red-500 text-white text-xs font-semibold rounded whitespace-nowrap shadow-lg"
                style={{
                  left: `${todayPercent}%`,
                  transform: `translate(${todayPercent > 80 ? '-100%' : todayPercent < 20 ? '0' : '-50%'}, -50%)`,
                  marginLeft: todayPercent > 80 ? '-4px' : todayPercent < 20 ? '4px' : '0',
                }}
              >
                Hôm nay
              </div>

              {/* Phase markers */}
              <div className="absolute top-0 left-0 right-0 bottom-0 flex items-center justify-between px-2 pointer-events-none">
                <span className="text-xs font-semibold text-white drop-shadow-lg">Bắt đầu</span>
                <span className="text-xs font-semibold text-gray-700 drop-shadow-lg">Kết thúc</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
