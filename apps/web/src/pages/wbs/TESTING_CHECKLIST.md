# Phase 1: Column Visibility Toggle - Testing Checklist

## ✅ Completed Features

### Phase 1.1: Column Configuration
- ✅ Created `columnConfig.ts` with 9 column definitions
- ✅ Exported types: `ColumnConfig`, `ColumnDefinition`, `ColumnKey`
- ✅ Moved `ROW_HEIGHT` constant to shared config
- ✅ Created helper functions: `getVisibleColumnsCount()`, `getTotalColumnsCount()`, `resetColumnsToDefault()`

### Phase 1.2: State Management
- ✅ localStorage integration with key `wbs-visible-columns`
- ✅ State initialization from localStorage or defaults
- ✅ Auto-save on column visibility changes (useEffect)
- ✅ `toggleColumnVisibility()` with locked column protection
- ✅ `handleResetColumns()` function
- ✅ `activeColumns` computed value with useMemo

### Phase 1.3: Columns Dropdown UI
- ✅ Dropdown button with count badge: "Columns (6/9)"
- ✅ Checkbox menu items for all columns
- ✅ Eye/EyeOff icons for visibility state
- ✅ "Reset to Defaults" option with RotateCcw icon
- ✅ Disabled state for locked columns

### Phase 1.4: Dynamic Column Rendering
- ✅ Refactored `WBSTableRow` with `renderColumn()` switch
- ✅ Dynamic column rendering: `{columns.map(col => renderColumn(col))}`
- ✅ Table width auto-adjusts to visible columns
- ✅ Header and content render in sync

### Phase 1.5: UX Enhancements
- ✅ Keyboard shortcut: Ctrl+Shift+C to toggle dropdown
- ✅ Blue asterisk badge (*) when columns are customized
- ✅ Tooltips on locked columns explaining why they're required
- ✅ Locked columns styled in blue color
- ✅ Keyboard shortcut hint in dropdown header

---

## 🧪 Testing Checklist

### Test 1: Default State
- [ ] Fresh browser (clear localStorage)
- [ ] Navigate to WBS page
- [ ] Verify default columns visible: ID, WBS/Activity, Duration, Dates, Progress, Dependencies (6/9)
- [ ] Verify hidden columns: Resources, Effort, Cost
- [ ] No blue asterisk badge on Columns button

### Test 2: Toggle Column Visibility
- [ ] Click "Columns (6/9)" button
- [ ] Uncheck "Duration" column
- [ ] Verify: Duration column disappears from header AND content
- [ ] Verify: Button shows "Columns (5/9)"
- [ ] Verify: Blue asterisk (*) badge appears
- [ ] Check "Duration" again
- [ ] Verify: Column reappears in correct position

### Test 3: Locked Columns
- [ ] Open Columns dropdown
- [ ] Try to uncheck "ID" column
- [ ] Verify: Checkbox is disabled
- [ ] Verify: "Required" label shows
- [ ] Verify: Tooltip says "ID is required and cannot be hidden"
- [ ] Try to uncheck "WBS/Activity" column
- [ ] Verify: Same behavior (disabled, required, tooltip)
- [ ] Verify: Locked columns styled in blue

### Test 4: localStorage Persistence
- [ ] Toggle some columns (e.g., hide Duration and Progress)
- [ ] Note current state: "Columns (4/9)"
- [ ] Refresh page (F5)
- [ ] Verify: Column visibility matches before refresh
- [ ] Verify: Still shows "Columns (4/9)"
- [ ] Verify: Blue asterisk still present

### Test 5: Reset to Defaults
- [ ] Customize columns (hide/show some)
- [ ] Verify: Blue asterisk present
- [ ] Click "Reset to Defaults" button
- [ ] Verify: Columns return to default visibility (6/9)
- [ ] Verify: Blue asterisk disappears
- [ ] Verify: Default columns: ID, Tree, Duration, Dates, Progress, Dependencies

### Test 6: Keyboard Shortcut
- [ ] Close dropdown if open
- [ ] Press Ctrl+Shift+C
- [ ] Verify: Dropdown opens
- [ ] Press Ctrl+Shift+C again
- [ ] Verify: Dropdown closes
- [ ] Verify: Shortcut hint visible in dropdown header

### Test 7: Column Resize
- [ ] Hide some columns
- [ ] Resize a visible column (drag resize handle)
- [ ] Verify: Column width changes
- [ ] Toggle visibility of other columns
- [ ] Verify: Resized column maintains its width
- [ ] Refresh page
- [ ] Verify: Custom width persists (if width is also stored in localStorage)

### Test 8: Multiple Columns Toggle
- [ ] Show all columns (check Resources, Effort, Cost)
- [ ] Verify: Button shows "Columns (9/9)"
- [ ] Verify: Table width increases
- [ ] Verify: All columns visible in header and content
- [ ] Hide multiple columns at once
- [ ] Verify: Table width decreases
- [ ] Verify: Content cells align with headers

### Test 9: Column Order
- [ ] Toggle columns in random order
- [ ] Verify: Columns always render in definition order:
  - ID → WBS/Activity → Duration → Dates → Progress → Dependencies → Resources → Effort → Cost
- [ ] Not in the order they were toggled

### Test 10: Browser Compatibility
- [ ] Test in Chrome/Edge
- [ ] Test keyboard shortcut
- [ ] Test localStorage persistence
- [ ] Check for console errors
- [ ] Verify smooth animations

### Test 11: Edge Cases
- [ ] Try to hide all non-locked columns
- [ ] Verify: Only ID and WBS/Activity remain
- [ ] Verify: Button shows "Columns (2/9)"
- [ ] Reset to defaults
- [ ] Rapidly toggle multiple columns
- [ ] Verify: No flickering or race conditions
- [ ] Clear localStorage manually (DevTools)
- [ ] Refresh page
- [ ] Verify: Falls back to defaults gracefully

### Test 12: Visual Polish
- [ ] Hover over locked columns
- [ ] Verify: Cursor shows not-allowed
- [ ] Verify: Tooltip appears
- [ ] Check "Required" badge styling
- [ ] Check Eye/EyeOff icon colors
- [ ] Verify dropdown width (should be ~224px / w-56)
- [ ] Check dropdown alignment (should be "end")

### Test 13: Integration with Existing Features
- [ ] Toggle columns
- [ ] Edit a task inline (duration, progress, dependencies)
- [ ] Verify: Edits work normally
- [ ] Drag a task in Gantt chart
- [ ] Verify: Drag still works
- [ ] Expand/collapse WBS nodes
- [ ] Verify: Tree structure intact
- [ ] Add a new WBS node
- [ ] Verify: New node appears with correct columns

---

## 🐛 Known Issues to Check
- [ ] Column content cells sync with headers after toggle
- [ ] No duplicate React keys warnings in console
- [ ] Table width calculation correct with varying column visibility
- [ ] Dropdown doesn't close when clicking Reset button (should stay open or close gracefully)
- [ ] Keyboard shortcut doesn't conflict with browser shortcuts

---

## 📊 Test Results Summary

**Date**: _____________________  
**Tester**: ___________________  
**Browser**: __________________  

**Tests Passed**: _____ / 13  
**Issues Found**: _____________  

**Overall Status**: ⬜ Pass  ⬜ Fail  ⬜ Needs Review

---

## 🎯 Acceptance Criteria

✅ All default columns visible on first load  
✅ Toggle column shows/hides both header and content  
✅ Locked columns cannot be hidden  
✅ Column visibility persists across page reloads  
✅ Reset to Defaults restores original state  
✅ Keyboard shortcut (Ctrl+Shift+C) works  
✅ Blue badge indicates customized state  
✅ No console errors or warnings  
✅ All existing WBS features still work  

---

## 🚀 Next Phase

After Phase 1 is complete and tested:
- **Phase 2**: Resource Assignment UI (dropdowns, user avatars)
- **Phase 3**: Resources/Effort/Cost columns implementation
- **Phase 4**: Resource allocation analytics and reporting
