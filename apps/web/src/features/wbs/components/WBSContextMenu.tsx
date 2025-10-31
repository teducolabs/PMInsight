import { createPortal } from 'react-dom';
import { 
  ChevronUp, 
  ChevronDown, 
  FolderPlus, 
  Edit2, 
  Trash2, 
  Copy
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WBSNode } from '../types/wbs';

interface WBSContextMenuProps {
  node: WBSNode;
  position: { x: number; y: number };
  onClose: () => void;
  onInsertAbove: (node: WBSNode) => void;
  onInsertBelow: (node: WBSNode) => void;
  onAddChild: (node: WBSNode) => void;
  onEdit: (node: WBSNode) => void;
  onDelete: (node: WBSNode) => void;
  onDuplicate?: (node: WBSNode) => void;
}

interface MenuItem {
  type?: 'divider';
  label?: string;
  icon?: React.ComponentType<{ className?: string }>;
  onClick?: () => void;
  shortcut?: string;
  danger?: boolean;
}

export function WBSContextMenu({
  node,
  position,
  onClose,
  onInsertAbove,
  onInsertBelow,
  onAddChild,
  onEdit,
  onDelete,
  onDuplicate,
}: WBSContextMenuProps) {
  const menuItems: MenuItem[] = [
    {
      label: 'Thêm dòng phía trên',
      icon: ChevronUp,
      onClick: () => onInsertAbove(node),
      shortcut: 'Shift+Insert',
    },
    {
      label: 'Thêm dòng phía dưới',
      icon: ChevronDown,
      onClick: () => onInsertBelow(node),
      shortcut: 'Insert',
    },
    {
      label: 'Thêm mục con',
      icon: FolderPlus,
      onClick: () => onAddChild(node),
    },
    { type: 'divider' },
    {
      label: 'Chỉnh sửa',
      icon: Edit2,
      onClick: () => onEdit(node),
      shortcut: 'F2',
    },
    ...(onDuplicate
      ? [
          {
            label: 'Nhân bản',
            icon: Copy,
            onClick: () => onDuplicate(node),
            shortcut: 'Ctrl+D',
          },
        ]
      : []),
    { type: 'divider' },
    {
      label: 'Xóa',
      icon: Trash2,
      onClick: () => onDelete(node),
      shortcut: 'Delete',
      danger: true,
    },
  ];

  // Calculate position to keep menu in viewport
  const menuWidth = 240;
  const menuHeight = menuItems.length * 40; // Approximate
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  let x = position.x;
  let y = position.y;

  // Adjust if menu would overflow viewport
  if (x + menuWidth > viewportWidth) {
    x = viewportWidth - menuWidth - 10;
  }
  if (y + menuHeight > viewportHeight) {
    y = viewportHeight - menuHeight - 10;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50"
      onClick={onClose}
      onContextMenu={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <div
        className="absolute bg-white rounded-lg shadow-xl border border-gray-200 py-1 min-w-[240px]"
        style={{ top: y, left: x }}
        onClick={(e) => e.stopPropagation()}
      >
        {menuItems.map((item, idx) =>
          item.type === 'divider' ? (
            <div key={`divider-${idx}`} className="h-px bg-gray-200 my-1" />
          ) : (
            <button
              key={idx}
              className={cn(
                'w-full px-4 py-2 text-left flex items-center gap-3 transition-colors text-sm',
                'hover:bg-gray-100 focus:bg-gray-100 focus:outline-none',
                item.danger
                  ? 'text-red-600 hover:bg-red-50 focus:bg-red-50'
                  : 'text-gray-700'
              )}
              onClick={() => {
                item.onClick?.();
                onClose();
              }}
            >
              {item.icon && <item.icon className="w-4 h-4 flex-shrink-0" />}
              <span className="flex-1">{item.label}</span>
              {item.shortcut && (
                <span className="text-xs text-gray-400 font-mono">
                  {item.shortcut}
                </span>
              )}
            </button>
          )
        )}
      </div>
    </div>,
    document.body
  );
}
