# WBS Context Menu & Insert Operations - Implementation Checklist

## 🎯 Mục tiêu
Nâng cao UI/UX WBS giống MS Project với context menu, insert operations, auto-renumbering và dependency management.

---

## 📋 Implementation Progress

### Phase 1: Backend - WBS Insert Operations API ⏱️ 4-5h ✅ COMPLETED

#### 1.1 Update WBS Domain Model
- [x] Add `Position` field to `WBSNode.cs` (already exists as `SortOrder`)
- [x] Add position sorting logic

#### 1.2 Create Insert Node Request DTO
- [x] Create `InsertNodeCommand.cs` with `InsertPosition` enum
- [x] Create `InsertNodeCommandHandler.cs`
- [x] Add validation logic

#### 1.3 Implement Insert Logic
- [x] Calculate insert position (Above/Below/Child)
- [x] Shift sibling positions
- [x] Create new node with calculated position
- [x] Auto-assign sequence IDs after insert

#### 1.4 API Controller
- [x] Add `POST /wbs/{wbsId}/nodes/insert` endpoint
- [x] Add proper error handling
- [x] Add Swagger documentation
- [x] Create `InsertWBSNodeRequest` model

#### 1.5 Delete Node with Dependency Cleanup
- [x] Update `DeleteNodeCommandHandler.cs` with dependency cleanup
- [x] Remove dependencies on deleted node
- [x] Shift remaining siblings' positions  
- [x] Re-assign sequence IDs after delete

**Phase 1 Summary:**
- ✅ Added `InsertPosition` enum (Above, Below, Child)
- ✅ Created `InsertWBSNodeCommand` and handler
- ✅ Implemented `WBSMapper.InsertNodeAtPosition()` method
- ✅ Implemented `WBSMapper.AssignSequenceIds()` for auto-numbering
- ✅ Created `InsertWBSNodeRequest` DTO
- ✅ Added `POST /wbs/{wbsId}/nodes/insert` API endpoint
- ✅ Updated `DeleteWBSNodeCommandHandler` with dependency cleanup
- ✅ Auto re-sequence after insert/delete operations

**Files Created/Modified:**
- `PMInsight.Domain/Enums/Enums.cs` - Added `InsertPosition` enum
- `PMInsight.Application/WBS/Commands/InsertWBSNodeCommand.cs` - NEW
- `PMInsight.Application/WBS/Handlers/InsertWBSNodeCommandHandler.cs` - NEW
- `PMInsight.Application/WBS/Helpers/WBSMapper.cs` - Added helper methods
- `PMInsight.Api/Models/WBSRequests.cs` - Added request models
- `PMInsight.Api/Controllers/WBSController.cs` - Added insert endpoint
- `PMInsight.Application/WBS/Handlers/DeleteWBSNodeCommandHandler.cs` - Enhanced

---

### Phase 2: Backend - Auto-Renumbering & Dependencies ⏱️ MERGED WITH PHASE 1 ✅

**Note:** Auto-renumbering and dependency cleanup were already implemented in Phase 1:
- ✅ `WBSMapper.AssignSequenceIds()` - Auto-numbering with hierarchical codes
- ✅ `DeleteWBSNodeCommandHandler.RemoveDependenciesOnNode()` - Dependency cleanup
- ✅ Both insert and delete operations automatically trigger re-sequencing

---

### Phase 3: Frontend - Context Menu UI ⏱️ 3-4h ✅ COMPLETED

#### 3.1 Create Context Menu Component
- [x] Create `WBSContextMenu.tsx` with Portal
- [x] Add menu items (tiếng Việt):
  - [x] Thêm dòng phía trên
  - [x] Thêm dòng phía dưới
  - [x] Thêm mục con
  - [x] Chỉnh sửa
  - [x] Nhân bản
  - [x] Xóa
- [x] Add icons (Lucide)
- [x] Add keyboard shortcuts display
- [x] Add click-outside to close

#### 3.2 Update WBSTableRow
- [x] Add `onContextMenu` handler
- [x] Add hover indicator (blue bar on left)
- [x] Pass context menu callback

#### 3.3 Context Menu State in WBSPage
- [x] Add `contextMenu` state
- [x] Add `handleShowContextMenu`
- [x] Render `WBSContextMenu` conditionally

**Phase 3 Summary:**
- ✅ Created `WBSContextMenu` component with MS Project-style menu
- ✅ Created `QuickInsertDialog` for fast node insertion
- ✅ Updated `wbsApi.ts` with `insertNode()` method
- ✅ Added context menu handlers in WBSPage
- ✅ Added right-click handler to WBSTableRow with hover indicator
- ✅ All menu items in Vietnamese with keyboard shortcuts displayed

**Files Created/Modified:**
- `apps/web/src/features/wbs/components/WBSContextMenu.tsx` - NEW
- `apps/web/src/features/wbs/components/QuickInsertDialog.tsx` - NEW  
- `apps/web/src/features/wbs/components/index.ts` - Updated exports
- `apps/web/src/features/wbs/api/wbs.ts` - Added insertNode method
- `apps/web/src/pages/wbs/WBSPage.tsx` - Added context menu integration
- `apps/web/src/pages/wbs/WBSTableRow.tsx` - Added right-click handler

---

### Phase 4: Frontend - Insert Operations ⏱️ 3-4h ✅ COMPLETED

#### 4.1 Update API Client
- [x] Add `insertNode()` method in `wbsApi.ts`
- [x] Add `deleteNode()` method with affected nodes
- [x] Add TypeScript types for requests/responses

#### 4.2 Quick Insert Dialog
- [x] Create `QuickInsertDialog.tsx` (tiếng Việt)
- [x] Form fields: Name, Type
- [x] Show position context (trên/dưới/con của)
- [x] Validation

#### 4.3 Handle Insert in WBSPage
- [x] Add `insertMode` state
- [x] Implement `handleInsertAbove`
- [x] Implement `handleInsertBelow`
- [x] Implement `handleAddChildFromMenu`
- [x] Optimistic UI updates
- [x] Reload WBS after insert
- [x] Auto-expand parent for child inserts
- [ ] Scroll to new node (TODO)

**Phase 4 Summary:**
- ✅ All insert operations fully functional
- ✅ Quick insert dialog integrated
- ✅ API client updated with insertNode method
- ✅ Context menu triggers insert dialog correctly
- ✅ Auto-reload and re-sequencing after insert
- ⚠️ Scroll to new node - pending

---

### Phase 5: Frontend - Delete with Confirmation ⏱️ 1-2h

#### 5.1 Delete Confirmation Dialog
- [ ] Create `DeleteNodeDialog.tsx` (tiếng Việt)
- [ ] Show warnings for:
  - [ ] Nodes with children
  - [ ] Nodes with dependents
- [ ] Add confirmation button

#### 5.2 Handle Delete in WBSPage
- [ ] Add `nodeToDelete` state
- [ ] Find dependent nodes before delete
- [ ] Call delete API
- [ ] Reload WBS after delete
- [ ] Show success toast

---

### Phase 6: Frontend - Keyboard Shortcuts ⏱️ 2h

#### 6.1 Keyboard Handler Hook
- [ ] Create `useWBSKeyboardShortcuts.ts`
- [ ] Support shortcuts:
  - [ ] `Insert` - Insert Below
  - [ ] `Shift+Insert` - Insert Above
  - [ ] `F2` - Edit
  - [ ] `Delete` - Delete with confirmation
  - [ ] `Ctrl+D` - Duplicate

#### 6.2 Row Selection State
- [ ] Add `selectedNodeId` state in WBSPage
- [ ] Add click handler to rows
- [ ] Highlight selected row
- [ ] Integrate keyboard shortcuts hook

---

### Phase 7: Frontend - Visual Feedback ⏱️ 2-3h

#### 7.1 Insert Position Indicators
- [ ] Create `InsertIndicator.tsx` component
- [ ] Blue line with dot on left
- [ ] Position above/below

#### 7.2 Hover State with Insert Hints
- [ ] Add hover zones (top/bottom of row)
- [ ] Show insert indicators on hover
- [ ] Add click handlers for quick insert
- [ ] Add tooltips

#### 7.3 Loading States
- [ ] Show skeleton during insert
- [ ] Show loading spinner
- [ ] Disable interactions during operations

---

### Phase 8: Testing & Polish ⏱️ 2-3h

#### 8.1 Backend Tests
- [ ] Unit tests for `InsertNodeCommandHandler`
- [ ] Unit tests for `DeleteNodeCommandHandler`
- [ ] Unit tests for `WBSSequenceService`
- [ ] Unit tests for `DependencyUpdateService`
- [ ] Integration tests for API endpoints

#### 8.2 Frontend Tests
- [ ] E2E test: Right-click shows menu
- [ ] E2E test: Insert above/below works
- [ ] E2E test: Delete with confirmation
- [ ] E2E test: Keyboard shortcuts
- [ ] E2E test: Dependency updates

#### 8.3 UI/UX Polish
- [ ] Smooth animations
- [ ] Toast notifications (success/error)
- [ ] Accessibility (ARIA labels)
- [ ] Performance optimization
- [ ] Documentation

---

## ⏱️ Time Estimation

| Phase | Effort | Status |
|-------|--------|--------|
| Backend Insert API | 4-5h | ⏳ In Progress |
| Backend Delete + Dependencies | 4-5h | 🔜 Pending |
| Context Menu UI | 3-4h | 🔜 Pending |
| Quick Insert Dialog | 2h | 🔜 Pending |
| Delete Confirmation | 1-2h | 🔜 Pending |
| Keyboard Shortcuts | 2h | 🔜 Pending |
| Visual Indicators | 2-3h | 🔜 Pending |
| Auto-Renumbering | 2-3h | 🔜 Pending |
| Testing | 2-3h | 🔜 Pending |

**Total: 22-30 hours (~3-4 days)**

---

## 🚀 Current Phase: Phase 5 - Delete Confirmation

### Completed Phases:
- ✅ **Phase 1**: Backend Insert API (4-5h)
- ✅ **Phase 2**: Auto-Renumbering (merged with Phase 1)
- ✅ **Phase 3**: Context Menu UI (3-4h)
- ✅ **Phase 4**: Insert Operations (3-4h)

### Current Work (Phase 5):
1. ⏳ Create DeleteNodeDialog with warnings
2. ⏳ Handle delete with confirmation in WBSPage
3. ⏳ Find dependent nodes before delete
4. ⏳ Show success/error toasts

**Remaining Work:** Delete confirmation, keyboard shortcuts, visual indicators, testing

**Estimated time remaining:** ~6-8 hours

---

## 📝 Notes

- All UI labels and messages in Vietnamese
- Follow MS Project UX patterns
- Maintain backward compatibility
- Auto-save on all operations
- Show clear feedback to users

---

Last updated: October 31, 2025
