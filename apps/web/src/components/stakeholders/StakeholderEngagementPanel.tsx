import { useState } from 'react';
import { Stakeholder } from '@/types/stakeholder';
import { 
  EngagementAction, 
  EngagementHistory, 
  EngagementActionStatus, 
  EngagementActionPriority,
  PLAYBOOK_TEMPLATES,
  CreateEngagementActionRequest,
  UpdateEngagementActionRequest,
  CreateEngagementHistoryRequest,
} from '@/types/stakeholder-engagement';
import { stakeholderEngagementApi } from '@/lib/api/stakeholder';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  XCircle, 
  Plus,
  Calendar,
  MessageSquare,
  Phone,
  Mail,
  User,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface StakeholderEngagementPanelProps {
  stakeholder: Stakeholder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StakeholderEngagementPanel({ 
  stakeholder, 
  open, 
  onOpenChange 
}: StakeholderEngagementPanelProps) {
  const [activeTab, setActiveTab] = useState('playbook');
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<EngagementAction | null>(null);
  const [noteText, setNoteText] = useState('');
  const [noteSentiment, setNoteSentiment] = useState<'positive' | 'neutral' | 'negative'>('neutral');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch engagement history
  const { data: historyData = [], isLoading: isLoadingHistory } = useQuery({
    queryKey: ['stakeholder-engagement-history', stakeholder?.id],
    queryFn: () => stakeholderEngagementApi.getHistory(stakeholder!.id),
    enabled: open && !!stakeholder?.id,
  });

  // Fetch engagement actions
  const { data: actionsData = [], isLoading: isLoadingActions } = useQuery({
    queryKey: ['stakeholder-engagement-actions', stakeholder?.id],
    queryFn: () => stakeholderEngagementApi.getActions(stakeholder!.id),
    enabled: open && !!stakeholder?.id,
  });

  // Create action mutation
  const createActionMutation = useMutation({
    mutationFn: (data: CreateEngagementActionRequest) => 
      stakeholderEngagementApi.createAction(data),
    onSuccess: () => {
      if (stakeholder) {
        queryClient.invalidateQueries({ 
          queryKey: ['stakeholder-engagement-actions', stakeholder.id] 
        });
      }
      toast({
        title: 'Thành công',
        description: 'Đã thêm action mới',
      });
    },
    onError: () => {
      toast({
        title: 'Lỗi',
        description: 'Không thể thêm action',
        variant: 'destructive',
      });
    },
  });

  // Update action mutation
  const updateActionMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEngagementActionRequest }) =>
      stakeholderEngagementApi.updateAction(id, data),
    onSuccess: () => {
      if (stakeholder) {
        queryClient.invalidateQueries({ 
          queryKey: ['stakeholder-engagement-actions', stakeholder.id] 
        });
      }
      toast({
        title: 'Thành công',
        description: 'Đã cập nhật action',
      });
    },
    onError: () => {
      toast({
        title: 'Lỗi',
        description: 'Không thể cập nhật action',
        variant: 'destructive',
      });
    },
  });

  // Create history mutation
  const createHistoryMutation = useMutation({
    mutationFn: (data: CreateEngagementHistoryRequest) =>
      stakeholderEngagementApi.createHistory(data),
    onSuccess: () => {
      if (stakeholder) {
        queryClient.invalidateQueries({ 
          queryKey: ['stakeholder-engagement-history', stakeholder.id] 
        });
      }
    },
    onError: () => {
      toast({
        title: 'Lỗi',
        description: 'Không thể tạo lịch sử',
        variant: 'destructive',
      });
    },
  });

  // Early return after all hooks
  if (!stakeholder) return null;

  // Determine quadrant
  const getQuadrant = (influence: number, interest: number) => {
    if (influence >= 3 && interest >= 3) return 'manage-closely';
    if (influence >= 3 && interest < 3) return 'keep-satisfied';
    if (influence < 3 && interest >= 3) return 'keep-informed';
    return 'monitor';
  };

  const quadrant = getQuadrant(stakeholder.influence, stakeholder.interest);
  const playbook = PLAYBOOK_TEMPLATES[quadrant];

  // Always show all playbook templates, merge with DB actions
  // Create a map of existing actions by title for matching
  const actionsByTitle = new Map(
    actionsData.map(action => [action.title, action])
  );

  const actions: EngagementAction[] = playbook.map((template, index) => {
    // Check if this action already exists in DB
    const existingAction = actionsByTitle.get(template.title);
    
    if (existingAction) {
      // Return the DB version
      return existingAction;
    } else {
      // Return template as suggestion
      return {
        id: `template-${index}`,
        stakeholderId: stakeholder.id,
        title: template.title,
        description: template.description,
        quadrant,
        priority: template.priority,
        status: EngagementActionStatus.NotStarted,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }
  });

  const history: EngagementHistory[] = historyData;

  const handleCompleteAction = async (action: EngagementAction) => {
    if (action.id.startsWith('template-')) {
      // Create new action from template
      const index = parseInt(action.id.split('-')[1]);
      const template = playbook[index];
      
      try {
        const newAction = await createActionMutation.mutateAsync({
          stakeholderId: stakeholder.id,
          title: template.title,
          description: template.description,
          quadrant,
          priority: template.priority,
        });

        // Create history entry for action creation
        await createHistoryMutation.mutateAsync({
          stakeholderId: stakeholder.id,
          actionId: newAction.id,
          type: 'update',
          title: `Đã tạo action: ${template.title}`,
          description: `Action mới được tạo từ playbook template cho quadrant ${quadrant}`,
          outcome: 'Action đã được thêm vào danh sách theo dõi',
          sentiment: 'neutral',
          performedAt: new Date(),
        });

        toast({
          title: 'Thành công',
          description: 'Đã áp dụng action và ghi nhận lịch sử',
        });
      } catch (error) {
        // Error already handled by mutation
      }
    } else {
      // Update existing action to completed
      try {
        await updateActionMutation.mutateAsync({
          id: action.id,
          data: {
            status: EngagementActionStatus.Completed,
            completedDate: new Date(),
          },
        });

        // Create history entry for action completion
        await createHistoryMutation.mutateAsync({
          stakeholderId: stakeholder.id,
          actionId: action.id,
          type: 'update',
          title: `Đã hoàn thành: ${action.title}`,
          description: `Action "${action.title}" đã được đánh dấu hoàn thành`,
          outcome: 'Action completed successfully',
          sentiment: 'positive',
          performedAt: new Date(),
        });

        toast({
          title: 'Hoàn thành',
          description: 'Action đã được đánh dấu hoàn thành và ghi nhận lịch sử',
        });
      } catch (error) {
        // Error already handled by mutation
      }
    }
  };

  const handleOpenNoteDialog = (action: EngagementAction) => {
    if (action.id.startsWith('template-')) {
      toast({
        title: 'Thông báo',
        description: 'Vui lòng áp dụng action trước khi thêm ghi chú',
        variant: 'default',
      });
      return;
    }
    
    setSelectedAction(action);
    setNoteText(action.notes || '');
    setNoteSentiment('neutral');
    setNoteDialogOpen(true);
  };

  const handleSaveNote = async () => {
    if (!selectedAction) return;
    
    try {
      await updateActionMutation.mutateAsync({
        id: selectedAction.id,
        data: { notes: noteText },
      });

      // Create history entry for note addition
      await createHistoryMutation.mutateAsync({
        stakeholderId: stakeholder.id,
        actionId: selectedAction.id,
        type: 'update',
        title: `Đã thêm ghi chú cho: ${selectedAction.title}`,
        description: noteText,
        outcome: 'Ghi chú đã được cập nhật',
        sentiment: noteSentiment,
        performedAt: new Date(),
      });

      toast({
        title: 'Thành công',
        description: 'Ghi chú đã được lưu và ghi nhận lịch sử',
      });

      setNoteDialogOpen(false);
      setSelectedAction(null);
      setNoteText('');
      setNoteSentiment('neutral');
    } catch (error) {
      // Error already handled by mutation
    }
  };

  const getStatusIcon = (status: EngagementActionStatus) => {
    switch (status) {
      case EngagementActionStatus.Completed:
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case EngagementActionStatus.InProgress:
        return <Clock className="h-4 w-4 text-blue-600" />;
      case EngagementActionStatus.Skipped:
        return <XCircle className="h-4 w-4 text-gray-400" />;
      default:
        return <Circle className="h-4 w-4 text-gray-300" />;
    }
  };

  const getStatusBadge = (status: EngagementActionStatus) => {
    const variants = {
      [EngagementActionStatus.Completed]: 'bg-green-100 text-green-800',
      [EngagementActionStatus.InProgress]: 'bg-blue-100 text-blue-800',
      [EngagementActionStatus.NotStarted]: 'bg-gray-100 text-gray-800',
      [EngagementActionStatus.Skipped]: 'bg-gray-100 text-gray-500',
    };
    
    const labels = {
      [EngagementActionStatus.Completed]: 'Hoàn thành',
      [EngagementActionStatus.InProgress]: 'Đang thực hiện',
      [EngagementActionStatus.NotStarted]: 'Chưa bắt đầu',
      [EngagementActionStatus.Skipped]: 'Bỏ qua',
    };

    return <Badge className={variants[status]}>{labels[status]}</Badge>;
  };

  const getPriorityBadge = (priority: EngagementActionPriority) => {
    const variants = {
      [EngagementActionPriority.Critical]: 'bg-red-100 text-red-800',
      [EngagementActionPriority.High]: 'bg-orange-100 text-orange-800',
      [EngagementActionPriority.Medium]: 'bg-yellow-100 text-yellow-800',
      [EngagementActionPriority.Low]: 'bg-gray-100 text-gray-800',
    };
    
    const labels = {
      [EngagementActionPriority.Critical]: 'Rất cao',
      [EngagementActionPriority.High]: 'Cao',
      [EngagementActionPriority.Medium]: 'Trung bình',
      [EngagementActionPriority.Low]: 'Thấp',
    };

    return <Badge className={variants[priority]}>{labels[priority]}</Badge>;
  };

  const getQuadrantInfo = () => {
    const info = {
      'manage-closely': {
        title: 'Quản lý chặt chẽ',
        color: 'text-red-700 bg-red-50 border-red-200',
        icon: AlertCircle,
        description: 'Ảnh hưởng cao, Quan tâm cao - Cần engagement tích cực nhất',
      },
      'keep-satisfied': {
        title: 'Giữ hài lòng',
        color: 'text-orange-700 bg-orange-50 border-orange-200',
        icon: TrendingUp,
        description: 'Ảnh hưởng cao, Quan tâm thấp - Maintain satisfaction',
      },
      'keep-informed': {
        title: 'Thông tin đầy đủ',
        color: 'text-blue-700 bg-blue-50 border-blue-200',
        icon: MessageSquare,
        description: 'Ảnh hưởng thấp, Quan tâm cao - Keep updated',
      },
      'monitor': {
        title: 'Theo dõi',
        color: 'text-gray-700 bg-gray-50 border-gray-200',
        icon: User,
        description: 'Ảnh hưởng thấp, Quan tâm thấp - Minimal effort',
      },
    };
    return info[quadrant];
  };

  const quadrantInfo = getQuadrantInfo();
  const QuadrantIcon = quadrantInfo.icon;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'meeting':
        return <Calendar className="h-4 w-4" />;
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'call':
        return <Phone className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getSentimentColor = (sentiment?: string) => {
    switch (sentiment) {
      case 'positive':
        return 'text-green-600';
      case 'negative':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Engagement Plan</DialogTitle>
          <DialogDescription>
            Kế hoạch tương tác và chăm sóc stakeholder: <strong>{stakeholder.name}</strong>
          </DialogDescription>
        </DialogHeader>

        {/* Quadrant Info Banner */}
        <div className={cn("rounded-lg border-2 p-4", quadrantInfo.color)}>
          <div className="flex items-start gap-3">
            <QuadrantIcon className="h-6 w-6 mt-0.5" />
            <div>
              <h3 className="font-bold text-lg">{quadrantInfo.title}</h3>
              <p className="text-sm mt-1">{quadrantInfo.description}</p>
              <div className="flex gap-2 mt-2">
                <Badge variant="outline">Ảnh hưởng: {stakeholder.influence}/5</Badge>
                <Badge variant="outline">Quan tâm: {stakeholder.interest}/5</Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="playbook">📋 Playbook ({actions.length})</TabsTrigger>
            <TabsTrigger value="history">📅 Lịch sử ({history.length})</TabsTrigger>
          </TabsList>

          {/* Playbook Tab */}
          <TabsContent value="playbook" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Các action items được khuyến nghị cho quadrant này
              </p>
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Thêm action tùy chỉnh
              </Button>
            </div>

            {isLoadingActions ? (
              <div className="text-center py-8 text-gray-500">Đang tải...</div>
            ) : (
              <div className="space-y-3">
                {actions.map((action, index) => (
                  <div
                    key={action.id}
                    className="rounded-lg border bg-white p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1">{getStatusIcon(action.status)}</div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-gray-700">
                                {index + 1}. {action.title}
                              </span>
                              {getPriorityBadge(action.priority)}
                              {action.id.startsWith('template-') && (
                                <Badge variant="outline" className="text-xs">
                                  Gợi ý
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              {action.description}
                            </p>
                          </div>
                          {getStatusBadge(action.status)}
                        </div>
                        
                        {action.notes && (
                          <div className="mt-2 text-sm text-gray-500 bg-gray-50 p-2 rounded">
                            💬 {action.notes}
                          </div>
                        )}

                        <div className="flex gap-2 mt-3">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleCompleteAction(action)}
                            disabled={
                              action.status === EngagementActionStatus.Completed ||
                              updateActionMutation.isPending ||
                              createActionMutation.isPending
                            }
                          >
                            {action.id.startsWith('template-') 
                              ? 'Áp dụng action này'
                              : action.status === EngagementActionStatus.Completed
                                ? 'Đã hoàn thành'
                                : 'Đánh dấu hoàn thành'}
                          </Button>
                          {!action.id.startsWith('template-') && (
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => handleOpenNoteDialog(action)}
                            >
                              Ghi chú
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Lịch sử tương tác và phản hồi từ stakeholder
              </p>
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Thêm ghi chú
              </Button>
            </div>

            {isLoadingHistory ? (
              <div className="text-center py-8 text-gray-500">Đang tải...</div>
            ) : history.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Chưa có lịch sử tương tác nào
              </div>
            ) : (
              <div className="space-y-3">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-lg border bg-white p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn("p-2 rounded-full bg-gray-100", getSentimentColor(item.sentiment))}>
                        {getTypeIcon(item.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold text-gray-900">{item.title}</h4>
                            <p className="text-sm text-gray-500">
                              {new Date(item.performedAt).toLocaleDateString('vi-VN', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                          <Badge variant="outline" className={getSentimentColor(item.sentiment)}>
                            {item.sentiment === 'positive' && '😊 Tích cực'}
                            {item.sentiment === 'neutral' && '😐 Trung lập'}
                            {item.sentiment === 'negative' && '😟 Tiêu cực'}
                            {!item.sentiment && '😐 Trung lập'}
                          </Badge>
                        </div>

                        <p className="text-sm text-gray-700 mt-2">{item.description}</p>

                        {item.outcome && (
                          <div className="mt-2 text-sm bg-blue-50 text-blue-900 p-2 rounded">
                            <strong>Kết quả:</strong> {item.outcome}
                          </div>
                        )}

                        {item.feedback && (
                          <div className="mt-2 text-sm bg-green-50 text-green-900 p-2 rounded">
                            <strong>Phản hồi:</strong> {item.feedback}
                          </div>
                        )}

                        {item.nextAction && (
                          <div className="mt-2 text-sm bg-yellow-50 text-yellow-900 p-2 rounded">
                            <strong>Hành động tiếp theo:</strong> {item.nextAction}
                          </div>
                        )}

                        <p className="text-xs text-gray-500 mt-2">
                          Thực hiện bởi: {item.performedBy}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>

      {/* Note Dialog */}
      <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Thêm ghi chú</DialogTitle>
            <DialogDescription>
              Thêm ghi chú cho action: <strong>{selectedAction?.title}</strong>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="note-text">Nội dung ghi chú</Label>
              <Textarea
                id="note-text"
                placeholder="Nhập ghi chú của bạn..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                rows={5}
                className="resize-none"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="note-sentiment">Đánh giá về tương tác</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={noteSentiment === 'positive' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setNoteSentiment('positive')}
                  className="flex-1"
                >
                  😊 Tích cực
                </Button>
                <Button
                  type="button"
                  variant={noteSentiment === 'neutral' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setNoteSentiment('neutral')}
                  className="flex-1"
                >
                  😐 Trung lập
                </Button>
                <Button
                  type="button"
                  variant={noteSentiment === 'negative' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setNoteSentiment('negative')}
                  className="flex-1"
                >
                  😟 Tiêu cực
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setNoteDialogOpen(false);
                setSelectedAction(null);
                setNoteText('');
                setNoteSentiment('neutral');
              }}
            >
              Hủy
            </Button>
            <Button
              onClick={handleSaveNote}
              disabled={!noteText.trim() || updateActionMutation.isPending}
            >
              {updateActionMutation.isPending ? 'Đang lưu...' : 'Lưu ghi chú'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
