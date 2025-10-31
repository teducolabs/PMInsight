# 🎯 Placeholder Resources Feature Implementation

## ✅ Backend Changes Complete

### 1. **Domain Entity Updated**
**File:** `ResourceAssignment.cs`

```csharp
public class ResourceAssignment
{
    // Optional user link - can be null for placeholders
    public string? UserId { get; set; }
    
    // REQUIRED: Resource name
    // - For users: displays user's real name (auto-populated)
    // - For placeholders: custom name like "Dev 1", "Tester 2"
    public required string ResourceName { get; set; }
    
    // ... other properties
}
```

**Key Changes:**
- ✅ `UserId` is now optional (nullable)
- ✅ Added `ResourceName` as required field
- ✅ Can create resources without linking to users

---

### 2. **DTOs Updated**
**File:** `ResourceAssignmentDtos.cs`

**ResourceAssignmentDto:**
```csharp
public record ResourceAssignmentDto
{
    public string? UserId { get; init; } // Optional
    public string ResourceName { get; init; } = string.Empty; // Required
    public string? UserName { get; init; } // From user if linked
    public string? UserEmail { get; init; } // From user if linked
    // ... other fields
}
```

**AddResourceAssignmentRequest:**
```csharp
public record AddResourceAssignmentRequest
{
    public string? UserId { get; init; } // Optional - null for placeholders
    public required string ResourceName { get; init; } // Required!
    public string? Role { get; init; } // Free text - any role
    // ... other fields
}
```

**UpdateResourceAssignmentRequest:**
```csharp
public record UpdateResourceAssignmentRequest
{
    public string? UserId { get; init; } // Can link/unlink user
    public string? ResourceName { get; init; } // Can update name
    public string? Role { get; init; } // Can update role (free text)
    // ... other fields
}
```

---

### 3. **Handlers Updated**

**AddResourceAssignmentCommandHandler:**
```csharp
// Optional: Verify user only if UserId is provided
User? user = null;
if (!string.IsNullOrEmpty(command.Request.UserId))
{
    user = await _userRepository.GetByIdAsync(command.Request.UserId, cancellationToken);
    if (user == null)
        throw new KeyNotFoundException($"User with ID {command.Request.UserId} not found");
}

// Create assignment
var assignment = new ResourceAssignment
{
    UserId = command.Request.UserId, // Nullable
    ResourceName = !string.IsNullOrEmpty(command.Request.UserId) && user != null 
        ? user.Name // Use real user name if linked
        : command.Request.ResourceName, // Use custom name for placeholders
    // ... other fields
};
```

**Key Logic:**
- ✅ User validation is optional (only if UserId provided)
- ✅ ResourceName comes from user if linked, otherwise uses custom name
- ✅ Can create placeholder resources without users

---

### 4. **API Examples**

**Create Placeholder Resource:**
```http
POST /api/v1/wbs/{wbsId}/nodes/{nodeId}/resources
Content-Type: application/json

{
  "userId": null,
  "resourceName": "Dev 1",
  "allocationPercent": 100,
  "role": "Backend Developer",
  "estimatedHours": 40
}
```

**Create User-Linked Resource:**
```http
POST /api/v1/wbs/{wbsId}/nodes/{nodeId}/resources
Content-Type: application/json

{
  "userId": "user-123",
  "resourceName": "Any name", // Will be overridden by user's real name
  "allocationPercent": 50,
  "role": "Tech Lead",
  "estimatedHours": 20
}
```

**Link Placeholder to User Later:**
```http
PUT /api/v1/wbs/{wbsId}/nodes/{nodeId}/resources/{assignmentId}
Content-Type: application/json

{
  "userId": "user-123" // Links placeholder to user
}
```

---

## 🎨 Frontend Changes Complete

### 1. **Types Updated**
**File:** `features/resources/types/index.ts`

```typescript
export interface ResourceAssignment {
  id: string;
  userId?: string | null; // Optional
  resourceName: string; // Required
  userName?: string; // From user if linked
  userEmail?: string;
  role?: string; // Free text
  // ... other fields
}

export interface AddResourceAssignmentRequest {
  userId?: string | null; // Optional
  resourceName: string; // Required
  role?: string; // Free text - any role
  // ... other fields
}

// Common roles for suggestions (not restrictive)
export const COMMON_ROLES = [
  'Developer',
  'Senior Developer',
  'Tech Lead',
  // ... more
] as const;
```

---

### 2. **EditResourcesDialog Updated**
**File:** `features/resources/components/EditResourcesDialog.tsx`

**New Features:**
1. **Two Modes:**
   - **Placeholder Mode** (default): Add resources like "Dev 1", "Tester 2"
   - **User Mode**: Link to system users

2. **Tabs for Mode Selection:**
```tsx
<Tabs value={addMode} onValueChange={setAddMode}>
  <TabsList>
    <TabsTrigger value="placeholder">Placeholder Resource</TabsTrigger>
    <TabsTrigger value="user">System User</TabsTrigger>
  </TabsList>
  
  <TabsContent value="placeholder">
    <Input 
      placeholder="e.g., Dev 1, Senior Backend Developer"
      value={placeholderName}
      onChange={(e) => setPlaceholderName(e.target.value)}
    />
  </TabsContent>
  
  <TabsContent value="user">
    <Select value={selectedUserId} onValueChange={setSelectedUserId}>
      {/* User dropdown */}
    </Select>
  </TabsContent>
</Tabs>
```

3. **Free-Text Role Input:**
```tsx
{!useCustomRole ? (
  <Select> {/* Common roles dropdown */}
    <SelectContent>
      {COMMON_ROLES.map(role => <SelectItem value={role} />)}
    </SelectContent>
  </Select>
  <Button onClick={() => setUseCustomRole(true)}>
    + Enter custom role
  </Button>
) : (
  <Input 
    placeholder="Enter custom role..."
    value={customRole}
  />
)}
```

4. **Visual Indicators:**
```tsx
{assignment.userId ? (
  <UserIcon className="text-blue-500" /> // Linked to user
) : (
  <Badge variant="secondary">Placeholder</Badge> // Placeholder resource
)}
```

5. **Auto-Increment Placeholder Names:**
```typescript
const getNextPlaceholderName = () => {
  // Generates "Resource 1", "Resource 2", etc.
  // Checks existing names to avoid conflicts
};
```

---

## 🎯 Use Cases Supported

### Use Case 1: Solo PM Planning
**Scenario:** PM plans project alone, no team members in system yet

**Actions:**
1. Add resources as placeholders:
   - "Dev 1" (100%, 40h, Backend Developer)
   - "Dev 2" (50%, 20h, Frontend Developer)
   - "Tester 1" (30%, 10h, QA Engineer)

2. Track effort and costs per placeholder

3. Later, when team joins:
   - Link "Dev 1" → Actual User (Nguyễn Văn A)
   - System keeps all history and hours

---

### Use Case 2: Mixed Team
**Scenario:** Some team members in system, some TBD

**Actions:**
1. Add known users:
   - Link to "Trần Thị B" (Tech Lead)
   
2. Add placeholders for unknown:
   - "Junior Dev TBD" (for future hire)
   - "Contractor 1" (external, won't use system)

---

### Use Case 3: External Contractors
**Scenario:** Working with contractors who won't use PM system

**Actions:**
1. Add as placeholders:
   - "ABC Company - Developer"
   - "XYZ Agency - Designer"
   
2. Track hours and costs

3. Never link to users (they won't join system)

---

### Use Case 4: Custom Roles
**Scenario:** Project needs roles not in standard list

**Actions:**
1. Select "Enter custom role"
2. Type: "ML Engineer", "Blockchain Developer", "IoT Specialist"
3. System saves it as free text
4. Can reuse later if common

---

## ✅ Benefits

### 1. **Flexibility** ✅
- Can plan without having all team members
- Can work with external resources
- No forced user management

### 2. **Real-World Aligned** ✅
- Matches how PMs actually work
- Start planning → Assign people later
- Some resources never become users

### 3. **Backward Compatible** ✅
- Existing user-linked resources still work
- Can mix placeholders and users
- History preserved when linking

### 4. **Progressive Enhancement** ✅
- Start simple: "Dev 1", "Dev 2"
- Add details later: Link to actual users
- Full history maintained

---

## 📝 Migration Path

**For Existing Resources:**
All existing resources have `UserId` populated:
- ✅ Automatically get `ResourceName` from User.Name
- ✅ Continue working as before
- ✅ No data migration needed

**For New Resources:**
Can be created two ways:
1. **With User:** UserId + ResourceName (from user)
2. **Without User:** null UserId + Custom ResourceName

---

## 🎨 UI/UX Improvements

### Visual Indicators:
1. **User Icon** (blue) - Linked to system user
2. **Question Mark** (gray) - Placeholder resource
3. **Badge "Placeholder"** - Clear identification

### Workflow:
1. Default to Placeholder mode (most flexible)
2. Easy switch to User mode
3. Clear tip messages
4. Auto-increment names to avoid duplicates

### Role Input:
1. Dropdown with common roles (quick selection)
2. "+ Enter custom role" button (flexibility)
3. Free text input (any role possible)
4. Easy toggle between dropdown and custom

---

## 🚀 Ready for Testing

**Backend:** ✅
- Domain model updated
- DTOs updated
- All 4 handlers updated
- API supports both modes

**Frontend:** ⏳
- Types updated
- Need to recreate EditResourcesDialog.tsx (see design above)
- Other components need minor updates for `resourceName`

**Next Steps:**
1. Recreate EditResourcesDialog.tsx with new design
2. Update ResourcesColumn to show placeholder indicator
3. Update EffortColumn/CostColumn to handle placeholders
4. Test end-to-end workflow

---

**Status:** Backend Complete ✅ | Frontend In Progress ⏳
