import { useQuery } from '@tanstack/react-query';
import { stakeholderApi } from '@/lib/api/stakeholder';
import { Stakeholder } from '@/types/stakeholder';
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
import { Edit, Trash2, Mail, Phone } from 'lucide-react';

interface StakeholderTableProps {
  projectId: string;
}

export function StakeholderTable({ projectId }: StakeholderTableProps) {
  const { data: stakeholders, isLoading } = useQuery({
    queryKey: ['stakeholders', projectId],
    queryFn: () => stakeholderApi.getByProject(projectId),
  });

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
    <div className="rounded-lg border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tên</TableHead>
            <TableHead>Vai trò</TableHead>
            <TableHead>Loại</TableHead>
            <TableHead>Influence</TableHead>
            <TableHead>Interest</TableHead>
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
                  Level {stakeholder.influence}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge className={getInterestColor(stakeholder.interest)}>
                  Level {stakeholder.interest}
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
                  <Button variant="ghost" size="icon">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
