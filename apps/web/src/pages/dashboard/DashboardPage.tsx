import { useAuth } from '@/lib/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function DashboardPage() {
  const { user, logout } = useAuth();

  return (
    <div className="w-full px-6 py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-600 mt-2">Chào mừng bạn đến với PMInsight!</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Thông tin người dùng</CardTitle>
            <CardDescription>Thông tin tài khoản của bạn</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <span className="font-semibold">Tên:</span> {user?.name}
              </div>
              <div>
                <span className="font-semibold">Email:</span> {user?.email}
              </div>
              <div>
                <span className="font-semibold">Vai trò:</span> {user?.roles.join(', ')}
              </div>
            </div>
            <Button onClick={logout} variant="outline" className="mt-4 w-full">
              Đăng xuất
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dự án</CardTitle>
            <CardDescription>Quản lý dự án của bạn</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500 mb-4">Chưa có dự án nào</p>
            <Button className="w-full">Tạo dự án mới</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Hoạt động gần đây</CardTitle>
            <CardDescription>Các hoạt động mới nhất</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500">Chưa có hoạt động nào</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
