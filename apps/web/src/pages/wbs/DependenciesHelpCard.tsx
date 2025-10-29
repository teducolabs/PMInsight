export function DependenciesHelpCard() {
  return (
    <div className="rounded-lg border bg-gradient-to-r from-amber-50 to-yellow-50 p-4">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center text-white font-bold">
          i
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-amber-900 mb-2">💡 Hướng dẫn nhập Dependencies (Predecessors)</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-amber-800 mb-2">
                <strong>Cú pháp:</strong>{' '}
                <code className="bg-white px-2 py-0.5 rounded font-mono">&lt;ID&gt;&lt;Type&gt;&lt;Lag&gt;</code>
              </p>
              <ul className="space-y-1 text-amber-700">
                <li>• <strong>ID:</strong> Số thứ tự task (cột ID bên trái)</li>
                <li>• <strong>Type:</strong> FS (Finish-Start), SS (Start-Start), FF (Finish-Finish), SF (hiếm dùng)</li>
                <li>• <strong>Lag:</strong> +2d (trì hoãn 2 ngày), -1d (sớm hơn 1 ngày), không ghi = 0</li>
              </ul>
            </div>
            <div>
              <p className="text-amber-800 mb-2"><strong>Ví dụ:</strong></p>
              <ul className="space-y-1 text-amber-700 font-mono text-xs">
                <li>• <code className="bg-white px-2 py-0.5 rounded">3FS</code> → Bắt đầu sau khi task 3 hoàn thành</li>
                <li>• <code className="bg-white px-2 py-0.5 rounded">4FS+2d</code> → Bắt đầu 2 ngày sau khi task 4 xong</li>
                <li>• <code className="bg-white px-2 py-0.5 rounded">5SS</code> → Bắt đầu cùng lúc với task 5</li>
                <li>• <code className="bg-white px-2 py-0.5 rounded">3FS,5SS+1d</code> → Nhiều predecessors (phân cách bằng dấu phẩy)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
