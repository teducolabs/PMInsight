import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StakeholderTable } from '@/components/stakeholders/StakeholderTable';
import { StakeholderMatrix } from '@/components/stakeholders/StakeholderMatrix';
import { CreateStakeholderDialog } from '@/components/stakeholders/CreateStakeholderDialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useProject } from '@/lib/context/ProjectContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Breadcrumb } from '@/components/ui/breadcrumb';

export function StakeholdersPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { currentProjectId, currentProjectName } = useProject();

  // If no project selected, show alert
  if (!currentProjectId) {
    return (
      <div className="w-full px-6 py-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Stakeholders</h1>
          <p className="mt-1 text-sm text-gray-500">
            Quản lý các bên liên quan của dự án
          </p>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Chưa chọn dự án</AlertTitle>
          <AlertDescription>
            Vui lòng chọn dự án từ dropdown ở góc trên bên trái để xem và quản lý stakeholders.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="w-full px-6 py-6 space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb items={[{ label: 'Stakeholders' }]} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Stakeholders</h1>
          <p className="mt-1 text-sm text-gray-500">
            Quản lý các bên liên quan cho dự án: <span className="font-semibold text-blue-600">{currentProjectName}</span>
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Thêm Stakeholder
        </Button>
      </div>

      {/* PMI Learning Card */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-blue-600 p-2 text-white">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900">📚 PMI: Stakeholder Management</h3>
            <p className="mt-1 text-sm text-blue-800">
              <strong>Stakeholder</strong> là cá nhân, nhóm hoặc tổ chức có thể ảnh hưởng hoặc bị ảnh hưởng bởi dự án.
              Việc quản lý stakeholder giúp đảm bảo sự hài lòng và hỗ trợ từ các bên liên quan.
            </p>
            <div className="mt-2 flex gap-4 text-sm">
              <div>
                <strong>Ảnh hưởng:</strong> Khả năng tác động đến dự án
              </div>
              <div>
                <strong>Quan tâm:</strong> Mức độ quan tâm đến dự án
              </div>
            </div>
            <div className="mt-3 p-3 bg-blue-100 rounded-lg">
              <p className="text-sm text-blue-900">
                💡 <strong>Engagement Playbook:</strong> Click vào stakeholder trong danh sách hoặc ma trận để xem 
                <strong> kế hoạch tương tác</strong> với action items theo thứ tự ưu tiên, tracking trạng thái, 
                và lịch sử phản hồi như CRM.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs: Table vs Matrix */}
      <Tabs defaultValue="table" className="w-full">
        <TabsList>
          <TabsTrigger value="table">Danh sách</TabsTrigger>
          <TabsTrigger value="matrix">Ma trận Influence/Interest</TabsTrigger>
        </TabsList>
        
        <TabsContent value="table" className="mt-6">
          <StakeholderTable projectId={currentProjectId} />
        </TabsContent>
        
        <TabsContent value="matrix" className="mt-6">
          <StakeholderMatrix projectId={currentProjectId} />
        </TabsContent>
      </Tabs>

      {/* Create Dialog */}
      <CreateStakeholderDialog
        projectId={currentProjectId}
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </div>
  );
}
