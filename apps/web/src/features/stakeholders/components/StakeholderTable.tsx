import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { stakeholderApi } from '../api';
import { Stakeholder } from '../types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Mail, Phone, ChevronDown, ChevronUp, ListChecks } from 'lucide-react';
import { UpdateStakeholderDialog } from './UpdateStakeholderDialog';
import { StakeholderEngagementPanel } from './StakeholderEngagementPanel';
import { toast } from '@/components/ui/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface StakeholderTableProps {
  projectId: string;
}

export function StakeholderTable({ projectId }: StakeholderTableProps) {
  const queryClient = useQueryClient();
  const [selectedStakeholder, setSelectedStakeholder] = useState<Stakeholder | null>(null);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [stakeholderToDelete, setStakeholderToDelete] = useState<Stakeholder | null>(null);
  const [isTableExpanded, setIsTableExpanded] = useState(false);
  const [isEngagementPanelOpen, setIsEngagementPanelOpen] = useState(false);
  const [engagementStakeholder, setEngagementStakeholder] = useState<Stakeholder | null>(null);

  const { data: response, isLoading } = useQuery({
    queryKey: ['stakeholders', projectId],
    queryFn: () => stakeholderApi.getByProject(projectId),
  });

  const stakeholders = response?.items || [];

  const deleteMutation = useMutation({
    mutationFn: (id: string) => stakeholderApi.delete(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['stakeholders', projectId] });
      await queryClient.refetchQueries({ queryKey: ['stakeholders', projectId] });
      
      toast({
        variant: "success",
        title: "✅ Thành công!",
        description: `Đã xóa stakeholder "${stakeholderToDelete?.name}" thành công.`,
      });
      
      setStakeholderToDelete(null);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "❌ Lỗi",
        description: error.message || 'Không thể xóa stakeholder. Vui lòng thử lại.',
      });
      setStakeholderToDelete(null);
    },
  });

  const handleEdit = (stakeholder: Stakeholder) => {
    setSelectedStakeholder(stakeholder);
    setIsUpdateDialogOpen(true);
  };

  const handleEngagement = (stakeholder: Stakeholder) => {
    setEngagementStakeholder(stakeholder);
    setIsEngagementPanelOpen(true);
  };

  const handleDeleteClick = (stakeholder: Stakeholder) => {
    setStakeholderToDelete(stakeholder);
  };

  const handleDeleteConfirm = () => {
    if (stakeholderToDelete) {
      deleteMutation.mutate(stakeholderToDelete.id);
    }
  };

  const getInfluenceColor = (level: number) => {
    if (level >= 4) return 'bg-red-100 text-red-800';
    if (level >= 3) return 'bg-orange-100 text-orange-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getInterestColor = (level: number) => {
    if (level >= 4) return 'bg-green-100 text-green-800';
    if (level >= 3) return 'bg-blue-100 text-blue-800';
    return 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return <div>Đang tải...</div>;
  }

  if (!stakeholders || stakeholders.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 p-12 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
          <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        </div>
        <h3 className="mt-4 text-lg font-medium text-gray-900">Chưa có stakeholder</h3>
        <p className="mt-1 text-sm text-gray-500">
          Bắt đầu bằng cách thêm stakeholder đầu tiên cho dự án
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Collapsible Info Card */}
      <div className="rounded-lg border bg-white">
        <button
          onClick={() => setIsTableExpanded(!isTableExpanded)}
          className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900">💡 Hướng dẫn sử dụng</h3>
          </div>
          {isTableExpanded ? (
            <ChevronUp className="h-5 w-5 text-gray-600" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-600" />
          )}
        </button>
        
        {isTableExpanded && (
          <div className="px-4 pb-4 text-sm text-gray-600">
            <ul className="space-y-2">
              <li>• <strong>Ảnh hưởng (Influence):</strong> Khả năng của stakeholder tác động đến dự án</li>
              <li>• <strong>Quan tâm (Interest):</strong> Mức độ quan tâm của stakeholder đối với dự án</li>
              <li>• Click vào biểu tượng <Edit className="inline h-3 w-3" /> để chỉnh sửa thông tin</li>
              <li>• Click vào biểu tượng <Trash2 className="inline h-3 w-3" /> để xóa stakeholder</li>
              <li>• Click vào biểu tượng <Mail className="inline h-3 w-3" /> hoặc <Phone className="inline h-3 w-3" /> để liên hệ trực tiếp</li>
            </ul>
          </div>
        )}
      </div>

      {/* Stakeholders Table */}
      <div className="rounded-lg border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tên</TableHead>
            <TableHead>Vai trò</TableHead>
            <TableHead>Loại</TableHead>
            <TableHead>Ảnh hưởng</TableHead>
            <TableHead>Quan tâm</TableHead>
            <TableHead>Liên hệ</TableHead>
            <TableHead className="text-right">Hành động</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {stakeholders.map((stakeholder: Stakeholder) => (
            <TableRow key={stakeholder.id}>
              <TableCell className="font-medium">{stakeholder.name}</TableCell>
              <TableCell>{stakeholder.role}</TableCell>
              <TableCell>
                <Badge variant="outline">{stakeholder.type}</Badge>
              </TableCell>
              <TableCell>
                <Badge className={getInfluenceColor(stakeholder.influence)}>
                  Mức {stakeholder.influence}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge className={getInterestColor(stakeholder.interest)}>
                  Mức {stakeholder.interest}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  {stakeholder.email && (
                    <a href={`mailto:${stakeholder.email}`} className="text-gray-400 hover:text-gray-600">
                      <Mail className="h-4 w-4" />
                    </a>
                  )}
                  {stakeholder.phone && (
                    <a href={`tel:${stakeholder.phone}`} className="text-gray-400 hover:text-gray-600">
                      <Phone className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => handleEngagement(stakeholder)}
                    title="Xem engagement plan"
                  >
                    <ListChecks className="h-4 w-4 text-blue-600" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => handleEdit(stakeholder)}
                    title="Chỉnh sửa"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-red-600 hover:text-red-700"
                    onClick={() => handleDeleteClick(stakeholder)}
                    title="Xóa"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </div>

      {/* Update Dialog */}
      <UpdateStakeholderDialog
        projectId={projectId}
        stakeholder={selectedStakeholder}
        open={isUpdateDialogOpen}
        onOpenChange={setIsUpdateDialogOpen}
      />

      {/* Engagement Panel */}
      <StakeholderEngagementPanel
        stakeholder={engagementStakeholder}
        open={isEngagementPanelOpen}
        onOpenChange={setIsEngagementPanelOpen}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!stakeholderToDelete} onOpenChange={() => setStakeholderToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa stakeholder <strong>"{stakeholderToDelete?.name}"</strong>? 
              Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

