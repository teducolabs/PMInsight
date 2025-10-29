# Column Visibility Toggle - Implementation Guide

## Overview

The Column Visibility Toggle feature allows users to customize which columns are displayed in the WBS table. This improves UX by letting users focus on relevant information and hide unused columns.

## Architecture

### File Structure

```
apps/web/src/pages/wbs/
├── columnConfig.ts          # Central column configuration
├── ColumnsDropdown.tsx      # Dropdown UI component
├── WBSTableRow.tsx          # Dynamic row renderer
├── WBSTableHeader.tsx       # Header renderer
└── WBSPage.tsx              # Main orchestrator
```

### Components

#### 1. `columnConfig.ts` - Central Configuration

**Purpose**: Single source of truth for all column definitions

**Key Exports**:
- `ROW_HEIGHT`: Constant for row height (50px)
- `ColumnConfig`: Legacy interface for backward compatibility
- `ColumnDefinition`: New interface with visibility controls
- `COLUMN_DEFINITIONS`: Array of 9 column definitions
- `DEFAULT_COLUMNS`: Converted array for state initialization
- Helper functions: `getVisibleColumnsCount()`, `getTotalColumnsCount()`, `resetColumnsToDefault()`

**Column Definition Structure**:
```typescript
interface ColumnDefinition {
  key: string;              // Unique identifier
  label: string;            // Display name
  width: number;            // Default width in px
  minWidth: number;         // Minimum width for resize
  maxWidth: number;         // Maximum width for resize
  defaultVisible: boolean;  // Visible by default?
  locked: boolean;          // Cannot be hidden?
  resizable: boolean;       // Can be resized?
  description?: string;     // Tooltip description
}
```

**Locked Columns**:
- `id`: Required for dependency referencing
- `tree`: Required for WBS structure visualization

**Default Visible Columns** (6/9):
- ID, WBS/Activity, Duration, Dates, Progress, Dependencies

**Hidden by Default** (for Phase 3):
- Resources, Effort, Cost

---

#### 2. `ColumnsDropdown.tsx` - UI Component

**Props**:
```typescript
interface ColumnsDropdownProps {
  columns: ColumnConfig[];
  onToggleColumn: (columnId: string) => void;
  onResetColumns: () => void;
}
```

**Features**:
- ✅ Dropdown button with count badge: "Columns (6/9)"
- ✅ Keyboard shortcut: Ctrl+Shift+C
- ✅ Blue asterisk badge (*) when columns customized
- ✅ Checkbox menu items with Eye/EyeOff icons
- ✅ Disabled state for locked columns
- ✅ Tooltips on locked columns
- ✅ "Reset to Defaults" button
- ✅ Keyboard shortcut hint in header

**State**:
```typescript
const [open, setOpen] = useState(false);
```

**Custom Visibility Detection**:
```typescript
const hasCustomVisibility = columns.some(col => {
  const definition = COLUMN_DEFINITIONS.find(def => def.key === col.id);
  return col.visible !== definition?.defaultVisible;
});
```

**Keyboard Shortcut**:
```typescript
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'C') {
      e.preventDefault();
      setOpen(prev => !prev);
    }
  };
  document.addEventListener('keydown', handleKeyDown);
  return () => document.removeEventListener('keydown', handleKeyDown);
}, []);
```

---

#### 3. `WBSTableRow.tsx` - Dynamic Row Renderer

**Key Change**: Switched from fixed JSX to dynamic rendering

**Before** (Fixed Order):
```tsx
{idColumn?.visible && <div>...</div>}
{treeColumn?.visible && <div>...</div>}
{durationColumn?.visible && <div>...</div>}
// ❌ Fixed order, doesn't follow columns array
```

**After** (Dynamic):
```tsx
const renderColumn = (col: ColumnConfig) => {
  if (!col.visible) return null;
  
  switch (col.id) {
    case 'id': return <div key={col.id}>...</div>;
    case 'tree': return <div key={col.id}>...</div>;
    case 'duration': return <div key={col.id}>...</div>;
    // ... all columns
  }
};

return (
  <div className="flex">
    {columns.map(col => renderColumn(col))}
  </div>
);
```

**Benefits**:
- ✅ Columns render in definition order
- ✅ Header and content stay in sync
- ✅ React key prop ensures proper re-rendering
- ✅ Easy to add new columns in future

---

#### 4. `WBSPage.tsx` - State Management

**localStorage Integration**:
```typescript
const STORAGE_KEY_VISIBLE_COLUMNS = 'wbs-visible-columns';

// Load from localStorage on mount
const [columns, setColumns] = useState<ColumnConfig[]>(() => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_VISIBLE_COLUMNS);
    if (saved) {
      const visibleColumnIds = new Set<string>(JSON.parse(saved));
      return DEFAULT_COLUMNS.map(col => ({
        ...col,
        visible: visibleColumnIds.has(col.id),
      }));
    }
  } catch (error) {
    console.error('Failed to load column visibility:', error);
  }
  return DEFAULT_COLUMNS;
});

// Auto-save on change
useEffect(() => {
  try {
    const visibleColumnIds = columns
      .filter(col => col.visible)
      .map(col => col.id);
    localStorage.setItem(STORAGE_KEY_VISIBLE_COLUMNS, JSON.stringify(visibleColumnIds));
  } catch (error) {
    console.error('Failed to save column visibility:', error);
  }
}, [columns]);
```

**Toggle Function with Locked Protection**:
```typescript
const toggleColumnVisibility = (columnId: string) => {
  setColumns(prev => prev.map(col => {
    if (col.id === columnId) {
      const definition = COLUMN_DEFINITIONS.find(def => def.key === columnId);
      if (definition?.locked) {
        return col; // Don't toggle locked columns
      }
      return { ...col, visible: !col.visible };
    }
    return col;
  }));
};
```

**Reset Function**:
```typescript
const handleResetColumns = () => {
  setColumns(resetColumnsToDefault());
};
```

**Active Columns (Performance)**:
```typescript
const activeColumns = useMemo(() => 
  columns.filter(col => col.visible),
  [columns]
);
```

**Table Width Calculation**:
```tsx
<div style={{ 
  minWidth: columns.reduce((sum, col) => 
    sum + (col.visible ? col.width : 0), 0
  )
}}>
  {/* Content */}
</div>
```

---

## Data Flow

```
User clicks dropdown
    ↓
ColumnsDropdown renders checkboxes
    ↓
User toggles column checkbox
    ↓
onToggleColumn(columnId) called
    ↓
WBSPage.toggleColumnVisibility()
    ↓
Updates columns state
    ↓
useEffect saves to localStorage
    ↓
WBSTableHeader re-renders (filters visible)
    ↓
WBSTableRow re-renders (maps & renders visible)
    ↓
UI updates immediately
```

---

## localStorage Schema

**Key**: `wbs-visible-columns`

**Value**: JSON array of visible column IDs
```json
["id", "tree", "duration", "dates", "progress", "dependencies"]
```

**Default** (if no localStorage):
```json
["id", "tree", "duration", "dates", "progress", "dependencies"]
```

**All visible**:
```json
["id", "tree", "duration", "dates", "progress", "dependencies", "resources", "effort", "cost"]
```

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+C` | Toggle columns dropdown |

---

## Styling Classes

### ColumnsDropdown
- `.gap-2` - Spacing between button elements
- `.w-56` - Dropdown width (224px)
- `.bg-blue-100` - Badge background (customized state)
- `.text-blue-600` - Locked column text color

### WBSTableRow
- `.flex` - Flexbox layout for columns
- `.border-r` - Right border between columns
- `.hover:bg-gray-50` - Row hover effect

### Locked Column Indicators
- Badge: `bg-blue-100 text-blue-700`
- Text: `text-blue-600`
- Label: "Required"

---

## Future Enhancements

### Phase 2: Resource Management
- [ ] Add Resources column (user assignment dropdown)
- [ ] Add Effort column (estimated hours input)
- [ ] Add Cost column (planned cost input)

### Phase 3: Column Reordering
- [ ] Drag-and-drop to reorder columns
- [ ] Save custom column order to localStorage

### Phase 4: Column Presets
- [ ] "Planning View" (show cost/effort)
- [ ] "Execution View" (show progress/dates)
- [ ] "Minimal View" (only ID/tree/dates)
- [ ] Save/load custom presets

### Phase 5: Export
- [ ] Export visible columns to CSV
- [ ] Export visible columns to Excel
- [ ] Respect column order in export

---

## Troubleshooting

### Issue: Columns toggle in dropdown but content doesn't update

**Cause**: Browser caching old WBSTableRow component

**Solution**:
1. Hard refresh: Ctrl+Shift+R or Ctrl+F5
2. Clear browser cache
3. Restart Vite dev server

### Issue: localStorage not persisting

**Cause**: Browser privacy mode or disabled localStorage

**Solution**:
1. Check browser console for localStorage errors
2. Disable privacy/incognito mode
3. Check browser localStorage permissions

### Issue: Locked columns can be toggled

**Cause**: `definition?.locked` not checking correctly

**Solution**:
1. Verify COLUMN_DEFINITIONS has `locked: true`
2. Check toggleColumnVisibility logic
3. Ensure column `key` matches `id`

### Issue: Column widths reset on visibility toggle

**Cause**: Width not stored in localStorage

**Solution**:
Current implementation only saves visibility. To persist width:
1. Extend localStorage schema to include widths
2. Save on column resize
3. Load widths on mount

---

## Testing Commands

```bash
# Run dev server
npm run dev

# Build for production
npm run build

# Check for TypeScript errors
npm run type-check

# Run linter
npm run lint
```

---

## Code Quality

### TypeScript
- ✅ All components fully typed
- ✅ No `any` types used
- ✅ Interfaces exported for reusability

### React Best Practices
- ✅ Custom hooks for keyboard shortcut
- ✅ useMemo for performance optimization
- ✅ useEffect for side effects (localStorage)
- ✅ Proper cleanup in useEffect

### Accessibility
- ✅ Keyboard shortcut (Ctrl+Shift+C)
- ✅ Tooltips on disabled elements
- ✅ ARIA labels (via shadcn/ui components)

---

## Performance Considerations

### Optimizations
1. **useMemo for activeColumns**: Prevents recalculation on every render
2. **React.memo for WBSTableRow**: Could be added for large datasets
3. **localStorage debouncing**: Could be added if performance issues arise

### Potential Bottlenecks
1. **Large WBS trees**: 1000+ nodes might slow down
2. **Rapid toggling**: Multiple state updates in quick succession
3. **localStorage I/O**: Synchronous localStorage calls

### Recommendations for Scale
- Consider IndexedDB for larger datasets
- Add virtual scrolling for 1000+ rows
- Debounce localStorage writes
- Add loading skeleton during initialization

---

## Related Files

- `apps/web/src/components/ui/dropdown-menu.tsx` - shadcn/ui dropdown
- `apps/web/src/components/ui/button.tsx` - shadcn/ui button
- `apps/web/src/components/ui/badge.tsx` - shadcn/ui badge
- `apps/web/src/types/wbs.ts` - WBS node type definitions

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-10-29 | Initial implementation |
| | | - Column visibility toggle |
| | | - localStorage persistence |
| | | - Locked columns |
| | | - Keyboard shortcuts |
| | | - UX enhancements |

---

## Contributors

- Development: GitHub Copilot + User
- Feature Request: User (Resource Management Phase 1)
- Testing: Pending

---

## License

Internal PMInsight project - proprietary code.
