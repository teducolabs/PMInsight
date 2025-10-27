import { useProject } from '@/lib/context/ProjectContext';
import { projectApi } from '@/lib/api/project';
import { useQuery } from '@tanstack/react-query';
import { Check, ChevronsUpDown, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import type { Project } from '@/types/project';

export function ProjectSelector() {
  const [open, setOpen] = useState(false);
  const { currentProjectId, currentProjectName, setCurrentProject } = useProject();
  const navigate = useNavigate();

  // Fetch projects from API
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: projectApi.getAll,
  });

  const handleSelectProject = (project: Project) => {
    setCurrentProject(project.id, project.name);
    setOpen(false);
    // Navigate to project detail page
    navigate(`/projects/${project.id}`);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[300px] justify-between"
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="flex items-center gap-2 text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Đang tải...
            </span>
          ) : currentProjectName ? (
            <span className="flex items-center gap-2">
              <span className="font-medium">{currentProjectName}</span>
            </span>
          ) : (
            <span className="text-gray-500">Chọn dự án...</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput placeholder="Tìm dự án..." />
          <CommandList>
            <CommandEmpty>
              {isLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : (
                'Không tìm thấy dự án.'
              )}
            </CommandEmpty>
            <CommandGroup heading="Dự án của bạn">
              {projects.map((project) => (
                <CommandItem
                  key={project.id}
                  value={project.name}
                  onSelect={() => handleSelectProject(project)}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      currentProjectId === project.id ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <div className="flex flex-col">
                    <span className="font-medium">{project.name}</span>
                    <span className="text-xs text-gray-500">{project.code}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
          <div className="border-t p-2">
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => {
                setOpen(false);
                navigate('/projects');
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Xem tất cả dự án
            </Button>
          </div>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
