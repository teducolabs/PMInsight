# Project Context Pattern - UX/UI Best Practice

## Problem
Stakeholders, Tasks, Risks, Issues đều thuộc về một **dự án cụ thể**. Người dùng cần biết rõ đang làm việc với dự án nào.

## Solution: Project Context Pattern

### 1. **Global Project Selector (Header)**

```
┌─────────────────────────────────────────────────┐
│ [Chọn dự án ▼]  [Search...]  [🔔] [User Menu]  │
└─────────────────────────────────────────────────┘
```

**Features:**
- Dropdown hiển thị tất cả projects của user
- Search trong list
- "Tạo dự án mới" button
- Lưu selection vào localStorage (persist khi refresh)
- Hiển thị project code và name

**Location:** Header (top-left)

**Implementation:**
- `ProjectContext` (React Context API)
- `ProjectSelector` (Combobox component)
- Shared across entire app

---

### 2. **Breadcrumb Navigation**

```
🏠 > Website Redesign > Stakeholders
```

**Features:**
- Home icon → Dashboard
- Project name (from context)
- Current page
- Clickable links to navigate back

**Location:** Top of each page

**Benefits:**
- User luôn biết vị trí hiện tại
- Easy navigation back
- Rõ ràng context

---

### 3. **Page Title with Context**

```
Stakeholders
Quản lý các bên liên quan cho dự án: Website Redesign
```

**Features:**
- Main title
- Subtitle với project name (highlighted)
- Clear indication of current project

---

### 4. **Guard: Require Project Selection**

```tsx
if (!currentProjectId) {
  return <Alert>Vui lòng chọn dự án...</Alert>
}
```

**Features:**
- Block access nếu chưa chọn project
- Friendly message guide user
- Red alert with icon

---

## Navigation Flows

### Flow 1: Quick Access (Recommended for Daily Use)

```
1. User logs in
2. Dashboard loads → Auto-select last used project
3. Click "Stakeholders" in sidebar
4. Stakeholders page loads with context
```

**Key:** Project context is persistent!

---

### Flow 2: Switch Project

```
1. User on Stakeholders page (Project A)
2. Click project selector
3. Select Project B
4. Page re-renders with Project B data
5. Context saved
```

**Key:** Context changes → Data reloads automatically

---

### Flow 3: First-Time User

```
1. User logs in (no previous project)
2. Click "Stakeholders" in sidebar
3. See alert: "Chưa chọn dự án"
4. Click project selector
5. Select a project
6. Stakeholders page loads
```

**Key:** Progressive disclosure - guide user step by step

---

## Technical Implementation

### 1. ProjectContext

```tsx
// Store current project globally
interface ProjectContextType {
  currentProjectId: string | null;
  currentProjectName: string | null;
  setCurrentProject: (id: string, name: string) => void;
  clearCurrentProject: () => void;
}

// Persist to localStorage
localStorage.setItem('currentProjectId', id);
```

### 2. ProjectSelector Component

```tsx
// Combobox with search
<Command>
  <CommandInput placeholder="Tìm dự án..." />
  <CommandList>
    {projects.map(project => (
      <CommandItem onSelect={() => setCurrentProject(project)}>
        {project.name}
      </CommandItem>
    ))}
  </CommandList>
</Command>
```

### 3. Page Guard

```tsx
const { currentProjectId } = useProject();

if (!currentProjectId) {
  return <RequireProjectAlert />;
}

// Fetch data with projectId
const { data } = useQuery(['stakeholders', currentProjectId], ...);
```

### 4. Auto-Refresh on Project Change

```tsx
// React Query automatically refetches when queryKey changes
useQuery({
  queryKey: ['stakeholders', currentProjectId], // ← Changes when project changes
  queryFn: () => api.getStakeholders(currentProjectId),
});
```

---

## Benefits of This Pattern

### ✅ **User Experience**
1. **Clear Context**: Luôn biết đang làm việc với project nào
2. **No Confusion**: Không bao giờ nhầm lẫn data giữa các projects
3. **Quick Switch**: Chuyển project nhanh chóng (1 click)
4. **Persistent**: Remember selection across page reloads

### ✅ **Developer Experience**
1. **Single Source of Truth**: Context at app level
2. **Automatic Re-fetch**: React Query handles cache invalidation
3. **Type Safe**: TypeScript ensures correctness
4. **Reusable**: All pages use same pattern

### ✅ **PMI Alignment**
1. **Project-Centric**: Phù hợp với PMI methodology
2. **Isolation**: Each project has separate data
3. **Audit Trail**: Track which project user is working on

---

## Alternative Patterns (NOT Recommended)

### ❌ Pattern 1: URL Params
```
/projects/123/stakeholders
```
**Problems:**
- User phải navigate qua project detail
- Không có quick switch
- Hard to bookmark

### ❌ Pattern 2: Filter Dropdown on Every Page
```
[Lọc theo dự án ▼] on each page
```
**Problems:**
- Repetitive
- State not shared
- Dễ quên filter → show wrong data

### ❌ Pattern 3: No Context
```
Show all stakeholders from all projects
```
**Problems:**
- Confusing và overwhelming
- Hard to manage
- Không phù hợp với PMI

---

## Future Enhancements

### 1. **Recent Projects**
```tsx
<CommandGroup heading="Gần đây">
  {recentProjects.map(...)}
</CommandGroup>
<CommandGroup heading="Tất cả dự án">
  {allProjects.map(...)}
</CommandGroup>
```

### 2. **Project Favorites**
```tsx
// Star icon to favorite projects
favorites: ['project-1', 'project-3']
```

### 3. **Multi-Project View** (Advanced)
```tsx
// Dashboard page: See overview of all projects
// Other pages: Single project context
```

### 4. **Project Switcher Keyboard Shortcut**
```tsx
// Cmd+K or Ctrl+K to open project selector
useHotkeys('mod+k', () => setOpen(true));
```

---

## Summary

**Best Practice cho PMInsight:**

1. ✅ **Global Project Selector** in Header
2. ✅ **ProjectContext** with localStorage persistence
3. ✅ **Breadcrumb** showing context
4. ✅ **Page Guard** requiring project selection
5. ✅ **React Query** auto-refetch on project change

**Result:**
- Clear UX
- No confusion
- Fast switching
- PMI-compliant
- Developer-friendly

---

## File Structure

```
src/
├── lib/
│   └── context/
│       └── ProjectContext.tsx          # Global state
├── components/
│   ├── layout/
│   │   ├── Header.tsx                  # With ProjectSelector
│   │   └── ProjectSelector.tsx         # Dropdown component
│   └── ui/
│       └── breadcrumb.tsx              # Navigation path
└── pages/
    └── stakeholders/
        └── StakeholdersPage.tsx        # Uses context + guard
```

---

**Kết luận:** Pattern này đảm bảo user luôn làm việc đúng context, tránh nhầm lẫn data giữa các projects, và phù hợp với cách quản lý dự án theo chuẩn PMI.
