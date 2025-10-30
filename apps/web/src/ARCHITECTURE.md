# Frontend Architecture

## Cấu trúc thư mục

```
src/
├── components/           # Shared components (UI + Layout only)
│   ├── layout/          # Layout components (AppLayout, Header, Sidebar, etc.)
│   └── ui/              # Reusable UI components (Button, Dialog, Input, etc.)
│
├── features/            # Feature modules (Domain-specific)
│   ├── projects/        # Projects management feature
│   │   ├── components/  # Project-specific components
│   │   ├── api/         # Project API calls
│   │   ├── types/       # Project-specific types
│   │   └── index.ts     # Public exports
│   │
│   ├── resources/       # Resource management feature
│   │   ├── components/  # Resource-specific components
│   │   ├── api/         # Resource API calls
│   │   ├── types/       # Resource-specific types
│   │   └── index.ts     # Public exports
│   │
│   ├── schedule/        # Gantt/Schedule feature
│   │   ├── components/  # Gantt chart components
│   │   ├── types/       # Schedule-specific types
│   │   └── index.ts     # Public exports
│   │
│   ├── stakeholders/    # Stakeholders management feature
│   │   ├── components/  # Stakeholder-specific components
│   │   ├── api/         # Stakeholder API calls
│   │   ├── types/       # Stakeholder-specific types
│   │   └── index.ts     # Public exports
│   │
│   └── wbs/             # WBS management feature
│       ├── components/  # WBS-specific components
│       ├── api/         # WBS API calls
│       ├── types/       # WBS-specific types
│       └── index.ts     # Public exports
│
├── pages/               # Page components (use features)
├── lib/                 # Utilities, contexts, hooks
│   ├── api/            # Shared API utilities (client.ts only)
│   └── context/        # React contexts
└── types/               # ❌ REMOVED - Types now in features
```

## Nguyên tắc tổ chức

### 1. **components/** - Shared Components Only
- Chỉ chứa UI components dùng chung cho toàn hệ thống
- **layout/**: AppLayout, Header, Sidebar, Footer, ProjectSelector
- **ui/**: Button, Dialog, Input, Select, Table, Badge, etc.

### 2. **features/** - Domain-Specific Modules
Mỗi feature module có cấu trúc:
```
feature-name/
├── components/      # React components
├── api/            # API service calls (optional)
├── types/          # TypeScript interfaces (optional)
├── hooks/          # Custom hooks (optional)
└── index.ts        # Public exports
```

**Quy tắc:**
- Mỗi feature module phải có file `index.ts` để export public API
- Components chỉ export những gì cần thiết
- API calls được tổ chức trong `api/` folder
- Types được define trong `types/` folder

### 3. **pages/** - Page Components
- Import từ features thông qua barrel exports
- Không import trực tiếp từ `components/` của feature
- Example:
  ```typescript
  // ❌ Bad
  import { ProjectsTable } from '@/features/projects/components/ProjectsTable';
  
  // ✅ Good
  import { ProjectsTable } from '@/features/projects';
  ```

## Import Rules

### Trong Pages
```typescript
// UI components
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';

// Layout components
import { AppLayout } from '@/components/layout/AppLayout';

// Feature components (with types and API)
import { ProjectsTable, CreateProjectDialog, projectApi, type Project, ProjectStatus } from '@/features/projects';
import { ResourcePoolDialog, projectResourceApi, type ProjectResource } from '@/features/resources';
import { GanttGrid, GanttTimeline } from '@/features/schedule';
import { StakeholderTable, stakeholderApi, type Stakeholder } from '@/features/stakeholders';
import { CreateWBSNodeDialog, wbsApi, type WBSNode } from '@/features/wbs';
```

### Trong Features
```typescript
// Internal imports use relative paths
import { projectApi } from '../api';
import { type Project, ProjectStatus } from '../types';

// Features có thể import UI components
import { Button } from '@/components/ui/button';

// Features KHÔNG nên import từ features khác (tránh circular dependencies)
// Nếu cần share logic → move to lib/
```

## Benefits

1. **Clear Separation of Concerns**: UI components vs Domain logic
2. **Better Scalability**: Dễ dàng thêm features mới
3. **Code Reusability**: Shared components được tái sử dụng tốt hơn
4. **Maintainability**: Dễ tìm và sửa code theo domain
5. **Testability**: Dễ viết unit tests cho từng feature module
6. **Team Collaboration**: Nhiều dev có thể làm việc độc lập trên các features khác nhau

## Migration Completed

✅ **projects** module → `features/projects/` (components + api + types)
✅ **stakeholders** module → `features/stakeholders/` (components + api + types)
✅ **wbs** module → `features/wbs/` (components + api + types)
✅ **schedule** module → `features/schedule/` (components + types)
✅ **resources** module → `features/resources/` (đã có sẵn - components + api + types)

✅ All import paths updated
✅ All barrel exports created (index.ts for components, api, types)
✅ ❌ Removed old `types/` directory - types now in features
✅ ❌ Removed old API files from `lib/api/` - kept only client.ts
✅ No compilation errors

## Complete Feature Structure

Each feature module now has complete isolation:
```
feature-name/
├── components/
│   ├── Component1.tsx
│   ├── Component2.tsx
│   └── index.ts          # Export components
├── api/
│   ├── featureName.ts    # API service
│   └── index.ts          # Export API
├── types/
│   ├── featureName.ts    # Type definitions
│   └── index.ts          # Export types
└── index.ts              # Export everything (components, api, types)
```

This provides:
- **Complete encapsulation**: Each feature is self-contained
- **Clear dependencies**: Features only depend on shared lib and UI
- **Easy testing**: Mock APIs and types per feature
- **Better tree-shaking**: Import only what you need
- **Domain-driven**: Each feature represents a business domain
