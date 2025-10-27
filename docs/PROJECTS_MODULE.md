# Projects Module - PMI-Compliant with Junior-Friendly UX

## 🎯 Design Philosophy

**Target User:** Junior Project Managers học PMI  
**Goal:** Tạo dự án nhanh, học được methodology, UI đẹp dễ dùng

---

## ✨ Key Features

### 1. **Quick Create Dialog**
```
📝 Chỉ cần 4 fields bắt buộc:
- Tên dự án
- Mã dự án (auto-generate)
- Ngày bắt đầu
- Ngày kết thúc
```

**UX Highlights:**
- ✅ Auto-generate Code từ Name
- ✅ Hints màu xanh giải thích mỗi field
- ✅ PMI tooltips (VD: "Initiating là gì?")
- ✅ Default values hợp lý (Status: Initiating, Priority: Medium)
- ✅ Date picker tiếng Việt
- ✅ Optional fields có thể để sau
- ✅ Success message rõ ràng

**Example Hints:**
```
💡 Tip: Đặt tên ngắn gọn, dễ hiểu. Mã dự án sẽ tự động tạo từ tên.

📚 PMI: Project Code là unique identifier. Format thường dùng: DEPT-XXX (VD: IT-001, MKT-002).

📆 PMI: Planned Start/End Date là baseline. Actual dates sẽ track trong quá trình thực hiện.
```

---

### 2. **Dashboard Stats Cards**

```
┌─────────────────┬─────────────────┬─────────────────┬─────────────────┐
│ Tổng số dự án   │ Đang thực hiện  │ Hoàn thành      │ Tạm dừng        │
│      12         │       8         │       3         │       1         │
└─────────────────┴─────────────────┴─────────────────┴─────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│ Project Health Status (RAG)                                            │
│                                                                        │
│ 🔴 Critical (Red): 2    🟡 At Risk (Yellow): 3    🟢 On Track: 7      │
└────────────────────────────────────────────────────────────────────────┘
```

**Features:**
- Icon + số lượng + màu sắc phân biệt
- Hover effect + border-left animation
- RAG status với explanation
- Real-time từ API

---

### 3. **Advanced Filters**

```
┌──────────────────────────────────────────────────────────────────────┐
│ 🔍 [Tìm theo tên hoặc mã dự án...]                                   │
│                                                                      │
│ 🔽 [Tất cả trạng thái ▼]  🔽 [Tất cả độ ưu tiên ▼]                 │
└──────────────────────────────────────────────────────────────────────┘
```

**Filters:**
- Status: Initiating, Planning, Executing, Monitoring, Closing, On Hold
- Priority: Critical, High, Medium, Low
- Real-time search (name + code)
- Smooth animations

---

### 4. **Rich Projects Table**

| Mã       | Tên dự án         | PM        | Trạng thái | Ưu tiên | Health | Tiến độ      | Thời gian         | Actions |
|----------|-------------------|-----------|------------|---------|--------|--------------|-------------------|---------|
| WEB-001  | Website Redesign  | 👤 John   | 🟢 Executing | 🔴 Critical | 🟢 Green | ████░░ 65% | 01/01 - 31/03 | 👁️ ✏️ 🗑️ |

**Columns:**
1. **Code** - Mono font, easy to scan
2. **Name** + Description (truncated)
3. **PM** - Avatar + Name
4. **Status** - Colored badge with PMI terms
5. **Priority** - Red/Orange/Blue/Gray
6. **Health** - Dot + Label (RAG)
7. **Progress** - Bar + Percentage
8. **Dates** - Start - End (dd/MM/yy)
9. **Actions** - View/Edit/Delete

**UX Details:**
- Hover row → Light gray background
- Click row → Select project (context) + Navigate
- Eye icon → View details
- Edit icon → Quick edit
- Trash icon → Delete with confirmation
- Empty state with friendly message

---

### 5. **PMI Learning Integration**

```
┌──────────────────────────────────────────────────────────────────────┐
│ ℹ️  PMI: Project Life Cycle                                          │
│                                                                      │
│ Theo PMBOK Guide, dự án trải qua 5 process groups:                  │
│ Initiating → Planning → Executing → Monitoring & Controlling →      │
│ Closing                                                             │
│                                                                      │
│ 🟢 Green: On track  🟡 Yellow: At risk  🔴 Red: Critical issues    │
└──────────────────────────────────────────────────────────────────────┘
```

**Educational Elements:**
- Blue info card ở top mỗi page
- Icon + Clear hierarchy
- Vietnamese explanation + English terms
- Examples + Visual indicators
- Link to learn more (future)

---

## 🎨 UI/UX Best Practices Applied

### Colors & Visual Hierarchy

**Status Colors:**
- 🟣 Purple → Initiating
- 🔵 Blue → Planning
- 🟢 Green → Executing
- 🟡 Yellow → Monitoring & Controlling
- ⚪ Gray → Closing
- 🟠 Orange → On Hold
- 🔴 Red → Cancelled

**Priority Colors:**
- 🔴 Red → Critical
- 🟠 Orange → High
- 🔵 Blue → Medium
- ⚪ Gray → Low

**Health (RAG):**
- 🟢 Green → On track
- 🟡 Yellow → At risk
- 🔴 Red → Critical

### Typography
```css
- Page Title: 3xl font-bold (30px)
- Section Title: lg font-semibold (18px)
- Body: sm (14px)
- Hints: sm text-blue-800
- Meta: xs text-gray-500 (12px)
```

### Spacing
```css
- Section gap: 6 (24px)
- Card padding: 6 (24px)
- Form field gap: 4 (16px)
- Icon margin: 2 (8px)
```

### Animations
- Smooth transitions (150ms)
- Hover effects on cards/buttons
- Loading spinner
- Skeleton loaders (future)

---

## 📱 Responsive Design

### Desktop (1024px+)
- 4-column stats grid
- Full table with all columns
- Side-by-side filters

### Tablet (768px-1023px)
- 2-column stats grid
- Scrollable table
- Stacked filters

### Mobile (< 768px)
- 1-column stats grid
- Card view instead of table
- Collapsible filters

---

## 🔄 Integration with Project Context

```tsx
// When user clicks "View" on a project:
1. setCurrentProject(project.id, project.name)
2. Navigate to /projects/:id
3. Context saved to localStorage
4. Sidebar highlights current project
5. Breadcrumb shows: Home > Project Name > Tab
```

**Benefits:**
- User luôn biết đang xem project nào
- Quick switch từ header dropdown
- Persistent context

---

## 🚀 Future Enhancements

### Phase 2: Project Detail Page
```
Tabs:
- Overview (Charter, Objectives, Deliverables)
- Stakeholders (from StakeholdersPage)
- WBS (Work Breakdown Structure tree)
- Schedule (Gantt chart)
- Budget (Cost breakdown + EVM)
- Risks (Risk register + Matrix)
- Issues (Issue log)
- Changes (Change requests)
- Quality (Quality metrics)
- Communications (Comm plan)
- Procurement (Vendor management)
- Documents (File repository)
```

### Phase 3: Templates
```
- IT Project Template (ready)
- Event Project Template (ready)
- Construction Template
- Marketing Campaign Template
- Custom Template Builder
```

### Phase 4: AI Copilot
```
- Auto-generate WBS from description
- Risk prediction
- Schedule optimization
- Budget forecasting
- PMI exam prep quiz
```

---

## 📊 Performance Optimizations

### React Query
```tsx
// Cache projects for 5 minutes
queryKey: ['projects']
staleTime: 300000

// Optimistic updates on create/update
onMutate: async (newProject) => {
  await queryClient.cancelQueries(['projects'])
  const previous = queryClient.getQueryData(['projects'])
  queryClient.setQueryData(['projects'], (old) => [...old, newProject])
  return { previous }
}
```

### Lazy Loading
```tsx
// Load project detail on demand
const ProjectDetailPage = lazy(() => import('./pages/projects/ProjectDetailPage'))

// Load heavy charts only when needed
const GanttChart = lazy(() => import('./components/charts/GanttChart'))
```

### Virtualization (for large lists)
```tsx
// Use react-window for 1000+ projects
import { FixedSizeList } from 'react-window'
```

---

## 🎓 PMI Learning Path Integration

### Beginner (Green Belt)
- ✅ Understand 5 process groups
- ✅ Create project charter
- ✅ Identify stakeholders
- ✅ Create WBS

### Intermediate (Yellow Belt)
- ⏳ Develop schedule with dependencies
- ⏳ Calculate EVM (CPI, SPI)
- ⏳ Manage risks with matrix
- ⏳ Track changes

### Advanced (Black Belt)
- ⏳ Optimize critical path
- ⏳ Portfolio management
- ⏳ Multi-project resource allocation
- ⏳ Predictive analytics

---

## 📝 Component Structure

```
pages/
└── projects/
    ├── ProjectsPage.tsx          # Main list page
    └── ProjectDetailPage.tsx     # (Future) Detail with tabs

components/
└── projects/
    ├── ProjectStatsCards.tsx     # Dashboard stats
    ├── ProjectsTable.tsx         # Data table with filters
    ├── CreateProjectDialog.tsx   # Quick create form
    ├── ProjectCard.tsx           # (Mobile) Card view
    ├── ProjectHealthBadge.tsx    # RAG indicator
    └── ProjectProgressBar.tsx    # Progress visualization

types/
└── project.ts                    # TypeScript interfaces

lib/api/
└── project.ts                    # API client methods
```

---

## 🎯 Success Metrics

### User Experience
- ✅ Create project in < 30 seconds
- ✅ Learn 1 PMI concept per interaction
- ✅ Zero confusion about status/priority
- ✅ Beautiful, professional UI

### Technical
- ✅ < 200ms page load (cached)
- ✅ Type-safe API calls
- ✅ Optimistic UI updates
- ✅ Graceful error handling

### Business
- ✅ Increase PM adoption
- ✅ Reduce onboarding time
- ✅ Improve project success rate
- ✅ Higher user satisfaction

---

## 🎨 Visual Examples

### Empty State
```
┌────────────────────────────────────────────────────────┐
│                                                        │
│                    📁 (Icon)                           │
│                                                        │
│              Chưa có dự án nào                         │
│                                                        │
│     Bắt đầu bằng cách tạo dự án đầu tiên              │
│                                                        │
│            [🚀 Tạo dự án mới]                          │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### Loading State
```
┌────────────────────────────────────────────────────────┐
│                                                        │
│                    ⏳ (Spinner)                        │
│                                                        │
│              Đang tải danh sách dự án...               │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### Error State
```
┌────────────────────────────────────────────────────────┐
│  ⚠️  Không thể tải dữ liệu                             │
│                                                        │
│  Vui lòng kiểm tra kết nối và thử lại.                │
│                                                        │
│            [🔄 Thử lại]                                │
└────────────────────────────────────────────────────────┘
```

---

## 🔗 Related Modules

- **Dashboard** → Overview stats + Recent projects
- **Stakeholders** → Project context → Stakeholder list
- **WBS** → Project context → WBS tree
- **Tasks** → Project context → Task board
- **Risks** → Project context → Risk matrix
- **Budget** → Project context → EVM dashboard

---

## 📚 Documentation Links

- [PMBOK Guide 7th Edition](https://www.pmi.org/pmbok-guide-standards)
- [Project Management Body of Knowledge](https://www.pmi.org/learning/library)
- [PMI Agile Certified Practitioner](https://www.pmi.org/certifications/agile-acp)

---

**Kết luận:** Projects module là trái tim của PMInsight, thiết kế cho PM junior với UX thân thiện, PMI-compliant, và đẹp mắt. Mỗi interaction là một cơ hội học PMI! 🎓✨
