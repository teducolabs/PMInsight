import { useProject } from '@/lib/context/ProjectContext';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
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

// TODO: Replace with real data from API
const MOCK_PROJECTS = [
  { id: '1', name: 'Website Redesign', code: 'WEB-001' },
  { id: '2', name: 'Mobile App Development', code: 'MOB-001' },
  { id: '3', name: 'Marketing Campaign', code: 'MKT-001' },
];

export function ProjectSelector() {
  const [open, setOpen] = useState(false);
  const { currentProjectId, currentProjectName, setCurrentProject } = useProject();
  const navigate = useNavigate();

  const handleSelectProject = (project: typeof MOCK_PROJECTS[0]) => {
    setCurrentProject(project.id, project.name);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[300px] justify-between"
        >
          {currentProjectName ? (
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
            <CommandEmpty>Không tìm thấy dự án.</CommandEmpty>
            <CommandGroup heading="Dự án của bạn">
              {MOCK_PROJECTS.map((project) => (
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
                navigate('/projects/new');
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Tạo dự án mới
            </Button>
          </div>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
