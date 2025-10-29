import { Users, Plus, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { WBSNode } from '@/types/wbs';

interface ResourcesColumnProps {
  node: WBSNode;
  width: number;
  onEditResources: (node: WBSNode) => void;
}

export function ResourcesColumn({ node, width, onEditResources }: ResourcesColumnProps) {
  const assignments = node.resourceAssignments || [];
  const hasResources = assignments.length > 0;

  // Get primary resource
  const primaryResource = assignments.find(a => a.isPrimary);

  // Get initials for avatar
  const getInitials = (name: string | undefined): string => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Get color for avatar based on string hash
  const getAvatarColor = (id: string): string => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-orange-500',
      'bg-pink-500',
      'bg-teal-500',
      'bg-indigo-500',
      'bg-red-500',
    ];
    const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  // Format allocation percent
  const formatAllocation = (percent: number): string => {
    if (percent === 100) return '100%';
    return `${Math.round(percent)}%`;
  };

  return (
    <div
      className="flex items-center gap-2 py-2 px-4 border-r"
      style={{ width }}
    >
      {hasResources ? (
        <div className="flex items-center gap-2 flex-1">
          {/* Resource Avatars (max 3 visible) */}
          <div className="flex -space-x-2">
            {assignments.slice(0, 3).map((assignment) => (
              <TooltipProvider key={assignment.id}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold cursor-pointer border-2 border-white ${getAvatarColor(
                        assignment.userId
                      )} ${assignment.isPrimary ? 'ring-2 ring-yellow-400' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditResources(node);
                      }}
                    >
                      {getInitials(assignment.userName)}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <div className="text-sm">
                      <div className="font-semibold">
                        {assignment.userName || 'Unknown User'}
                        {assignment.isPrimary && ' ⭐'}
                      </div>
                      {assignment.role && (
                        <div className="text-gray-400">{assignment.role}</div>
                      )}
                      <div className="text-gray-400">
                        Allocation: {formatAllocation(assignment.allocationPercent)}
                      </div>
                      {assignment.estimatedHours > 0 && (
                        <div className="text-gray-400">
                          Est: {assignment.estimatedHours}h / Act: {assignment.actualHours}h
                        </div>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
            {assignments.length > 3 && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-300 text-gray-700 text-xs font-semibold cursor-pointer border-2 border-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditResources(node);
                      }}
                    >
                      +{assignments.length - 3}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <div className="text-sm">
                      {assignments.slice(3).map(a => (
                        <div key={a.id}>{a.userName || 'Unknown'}</div>
                      ))}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>

          {/* Primary Resource Badge (if exists) */}
          {primaryResource && (
            <div className="flex items-center gap-1 text-xs text-gray-600 truncate flex-1">
              <span className="font-medium truncate">
                {primaryResource.userName}
              </span>
              {primaryResource.role && (
                <Badge variant="outline" className="text-xs py-0 px-1">
                  {primaryResource.role}
                </Badge>
              )}
            </div>
          )}

          {/* Edit Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onEditResources(node);
            }}
            className="h-7 px-2 ml-auto"
          >
            <Edit2 className="w-3 h-3" />
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-gray-400 flex-1">
          <Users className="w-4 h-4" />
          <span className="text-sm">No resources</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onEditResources(node);
            }}
            className="h-7 px-2 ml-auto"
          >
            <Plus className="w-3 h-3 mr-1" />
            Add
          </Button>
        </div>
      )}
    </div>
  );
}
