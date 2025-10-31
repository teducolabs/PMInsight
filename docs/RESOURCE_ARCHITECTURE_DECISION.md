# 🎯 Resource Management Architecture - Recommendations

## 📊 Current Questions Analysis

### 1. "Có thể chọn lại resources đã tạo và assign ở task không?"
**Answer:** Nên có! Có 2 approaches:

#### **Approach A: Autocomplete Suggestions (Recommended for Phase 1)** ✅
- Khi user nhập tên resource, hiện suggestions từ resources đã dùng trong project
- User có thể:
  - Chọn từ suggestions → Copy info (name, role, rate)
  - Hoặc nhập tên mới
- **Không tạo entity mới**, chỉ duplicate data
- **Trade-off**: Easy to implement, nhưng không track utilization across tasks

#### **Approach B: Resource Pool (Better for Production)** 🎯
- Tạo `ProjectResource` entity (pool of resources)
- Tasks reference resources từ pool (foreign key relationship)
- Có thể track utilization, availability, conflicts
- **Trade-off**: More complex, cần migration

---

### 2. "ResourceAssignment là danh sách resource luôn không?"
**Answer:** Hiện tại **YES** - là danh sách embedded:

```typescript
WBSNode {
  resourceAssignments: ResourceAssignment[] // Embedded array
}

ResourceAssignment {
  id: string
  userId?: string | null
  resourceName: string // Name của resource
  role?: string
  allocationPercent: number
  estimatedHours: number
  actualHours: number
  // ... other tracking fields
}
```

**Note:** Mỗi task có list riêng của nó. Không share giữa các tasks.

---

### 3. "Chỉnh EditResourcesDialog để pick existing resources?"
**Answer:** Nên implement! Có 2 levels:

#### **Level 1: Smart Suggestions (Quick Win)** ✅
Update dialog để có autocomplete/suggestions:

```typescript
// API: GET /projects/{id}/resource-suggestions
{
  suggestions: [
    {
      resourceName: "Dev 1",
      role: "Backend Developer",
      usageCount: 5, // Used in 5 tasks
      avgAllocation: 75,
      totalHours: 200
    },
    {
      resourceName: "Nguyễn Văn A",
      userId: "user-123",
      role: "Tech Lead",
      usageCount: 3
    }
  ]
}

// UI: Combobox with suggestions
<Combobox>
  <ComboboxInput placeholder="Type resource name..." />
  <ComboboxOptions>
    <ComboboxOption>Create new: "Dev 1"</ComboboxOption>
    <ComboboxOption>
      📋 "Dev 1" - Backend Developer
      (Used in 5 tasks, avg 75%)
    </ComboboxOption>
  </ComboboxOptions>
</Combobox>
```

#### **Level 2: Resource Pool (Future)** 🎯
Create proper Resource Pool management:

```typescript
// New Entity
ProjectResource {
  id: string
  projectId: string
  resourceName: string
  userId?: string | null
  role?: string
  hourlyRate?: number
  createdAt: DateTime
}

// Assignment references pool
ResourceAssignment {
  id: string
  projectResourceId: string // FK to ProjectResource
  allocationPercent: number
  estimatedHours: number
  actualHours: number
}

// Two dialogs
1. ResourcePoolDialog - Manage project resources
2. AssignResourceDialog - Pick from pool and assign
```

---

## 🚀 Recommended Implementation Plan

### **Phase 1: Smart Suggestions (This Sprint)** ✅

#### Backend Changes:
```csharp
// New endpoint
[HttpGet("projects/{projectId}/resource-suggestions")]
public async Task<ResourceSuggestionsDto> GetResourceSuggestions(string projectId)
{
    // Query all WBS nodes in project
    // Aggregate unique resources
    // Return with usage stats
}
```

#### Frontend Changes:
```typescript
// Update EditResourcesDialog.tsx
1. Fetch suggestions on open
2. Replace Input with Combobox (from shadcn/ui)
3. Show suggestions with usage stats
4. Allow "Create new" option
5. Pre-fill role/allocation when selecting suggestion
```

**Benefits:**
- ✅ Quick to implement (1-2 days)
- ✅ Better UX (less typing, consistency)
- ✅ No schema changes
- ✅ Can track common resources

**Limitations:**
- ❌ Still duplicates data
- ❌ Can't enforce resource limits
- ❌ Manual utilization calculation

---

### **Phase 2: Resource Pool (Future Sprint)** 🎯

#### Backend Changes:
```csharp
// New entity
public class ProjectResource : TenantEntity
{
    public string ProjectId { get; set; }
    public string ResourceName { get; set; }
    public string? UserId { get; set; }
    public string? Role { get; set; }
    public decimal? HourlyRate { get; set; }
    public decimal? MonthlyCapacity { get; set; } // Working hours/month
}

// Updated ResourceAssignment
public class ResourceAssignment
{
    public string ProjectResourceId { get; set; } // FK
    // Remove: ResourceName, UserId (now in ProjectResource)
    // Keep: Allocation, Hours, Dates
}
```

#### Frontend Changes:
```typescript
// New dialog: ResourcePoolDialog
- List all project resources
- CRUD operations
- View utilization across tasks

// Updated: AssignResourceDialog  
- Pick from pool (dropdown/search)
- Set allocation & hours
- Show availability warning if over-allocated
```

**Benefits:**
- ✅ Single source of truth
- ✅ Easy utilization tracking
- ✅ Can show conflicts/over-allocation
- ✅ Better for capacity planning

**Costs:**
- ❌ More complex (3-5 days)
- ❌ Need data migration
- ❌ More UI to maintain

---

## 🎨 UI/UX Design Recommendations

### **For Phase 1 (Suggestions):**

```
┌─────────────────────────────────────────┐
│ Add Resource                             │
├─────────────────────────────────────────┤
│                                          │
│ Resource Name *                          │
│ ┌──────────────────────────────────┐   │
│ │ Type or select...         ▼      │   │
│ └──────────────────────────────────┘   │
│   ↓ Dropdown shows:                     │
│   ┌──────────────────────────────────┐ │
│   │ Create new: "De"                 │ │
│   ├──────────────────────────────────┤ │
│   │ 📋 Dev 1                         │ │
│   │    Backend Developer             │ │
│   │    Used in 5 tasks (avg 75%)    │ │
│   ├──────────────────────────────────┤ │
│   │ 📋 Dev 2                         │ │
│   │    Frontend Developer            │ │
│   │    Used in 3 tasks (avg 50%)    │ │
│   └──────────────────────────────────┘ │
│                                          │
│ Role: [Backend Developer    ▼]         │
│ Allocation: [100] %                     │
│                                          │
└─────────────────────────────────────────┘
```

**When user selects suggestion:**
- Auto-fill role
- Auto-fill typical allocation
- User can still modify

---

### **For Phase 2 (Pool):**

```
Project Resources Tab:
┌─────────────────────────────────────────┐
│  📋 Resource Pool    [+ Add Resource]   │
├─────────────────────────────────────────┤
│ Name              Role        Usage     │
├─────────────────────────────────────────┤
│ 👤 Nguyễn Văn A   Tech Lead   3 tasks  │
│    150h / 160h (94% utilized)          │
├─────────────────────────────────────────┤
│ ⚪ Dev 1          Backend     5 tasks   │
│    200h / ∞ (placeholder)              │
├─────────────────────────────────────────┤
│ 👤 Trần Thị B     Designer    2 tasks  │
│    80h / 160h (50% utilized)           │
└─────────────────────────────────────────┘

When assigning to task:
┌─────────────────────────────────────────┐
│ Assign Resources to Task                │
├─────────────────────────────────────────┤
│ Select Resource: [Nguyễn Văn A    ▼]   │
│                                          │
│ ⚠️ This resource is 94% utilized        │
│    Available: ~10h this month           │
│                                          │
│ Allocation: [50] %                      │
│ Estimated: [20] hours                   │
│                                          │
│ [Cancel]              [Assign Resource] │
└─────────────────────────────────────────┘
```

---

## 🔧 Implementation Code Snippets

### **Phase 1: Backend API**

```csharp
// New DTO
public record ResourceSuggestionDto
{
    public string ResourceName { get; init; }
    public string? UserId { get; init; }
    public string? Role { get; init; }
    public int UsageCount { get; init; }
    public decimal AverageAllocation { get; init; }
    public decimal TotalEstimatedHours { get; init; }
}

// New Query
public record GetProjectResourceSuggestionsQuery : IRequest<List<ResourceSuggestionDto>>
{
    public required string ProjectId { get; init; }
}

// Handler
public class GetProjectResourceSuggestionsQueryHandler 
    : IRequestHandler<GetProjectResourceSuggestionsQuery, List<ResourceSuggestionDto>>
{
    public async Task<List<ResourceSuggestionDto>> Handle(...)
    {
        // Get all WBS for project
        var wbsList = await _wbsRepository.GetByProjectIdAsync(projectId);
        
        // Flatten all assignments
        var allAssignments = wbsList
            .SelectMany(wbs => wbs.Tree)
            .SelectMany(node => node.ResourceAssignments)
            .ToList();
        
        // Group by resource name
        var suggestions = allAssignments
            .GroupBy(a => a.ResourceName)
            .Select(g => new ResourceSuggestionDto
            {
                ResourceName = g.Key,
                UserId = g.FirstOrDefault()?.UserId,
                Role = g.FirstOrDefault()?.Role,
                UsageCount = g.Count(),
                AverageAllocation = g.Average(a => a.AllocationPercent),
                TotalEstimatedHours = g.Sum(a => a.EstimatedHours)
            })
            .OrderByDescending(s => s.UsageCount)
            .ToList();
        
        return suggestions;
    }
}
```

---

### **Phase 1: Frontend Component**

```typescript
// features/resources/api/resourceSuggestionApi.ts
export const resourceSuggestionApi = {
  async getSuggestions(projectId: string) {
    const { data } = await apiClient.get(
      `/api/v1/projects/${projectId}/resource-suggestions`
    );
    return data as ResourceSuggestion[];
  }
};

// features/resources/components/ResourceCombobox.tsx
export function ResourceCombobox({ 
  value, 
  onChange, 
  projectId 
}: Props) {
  const [suggestions, setSuggestions] = useState<ResourceSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  
  useEffect(() => {
    if (open) {
      resourceSuggestionApi.getSuggestions(projectId)
        .then(setSuggestions);
    }
  }, [open, projectId]);
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="justify-between">
          {value || "Select resource..."}
          <ChevronDown />
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        <Command>
          <CommandInput placeholder="Search or create..." />
          <CommandEmpty>
            <Button onClick={() => onChange(value)}>
              Create new: "{value}"
            </Button>
          </CommandEmpty>
          <CommandGroup heading="Existing Resources">
            {suggestions.map(s => (
              <CommandItem
                key={s.resourceName}
                onSelect={() => {
                  onChange(s.resourceName);
                  onRoleChange(s.role); // Auto-fill
                  onAllocationChange(s.averageAllocation);
                  setOpen(false);
                }}
              >
                <div>
                  <div className="font-medium">{s.resourceName}</div>
                  <div className="text-sm text-gray-500">
                    {s.role} • Used in {s.usageCount} tasks (avg {s.averageAllocation}%)
                  </div>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
```

---

## ✅ Decision Matrix

| Feature | Phase 1 | Phase 2 |
|---------|---------|---------|
| **Reuse resources** | ⚠️ Via suggestions | ✅ True reuse |
| **Consistency** | ⚠️ Manual | ✅ Enforced |
| **Utilization tracking** | ❌ Manual calc | ✅ Automatic |
| **Conflict detection** | ❌ No | ✅ Yes |
| **Capacity planning** | ❌ No | ✅ Yes |
| **Implementation time** | ✅ 1-2 days | ❌ 3-5 days |
| **Schema changes** | ✅ None | ❌ New entity |
| **Data migration** | ✅ None | ❌ Required |
| **Complexity** | ✅ Low | ⚠️ Medium |

---

## 🎯 Final Decision

### **✅ DECISION: Implement Phase 2 (Resource Pool) - Full Solution**

**Rationale:**
1. **Long-term value** - Single source of truth for resources
2. **Complete feature set** - Utilization tracking, capacity planning, conflict detection
3. **Scalability** - Better foundation for future enhancements
4. **Data integrity** - No duplicate resource data across tasks
5. **Professional grade** - Production-ready resource management

---

## 🚀 Phase 2 Implementation Plan

### **Step 1: Backend - Domain Entity**

#### **1.1 Create ProjectResource Entity**
File: `apps/api/PMInsight.Domain/Entities/ProjectResource.cs`

```csharp
using PMInsight.Domain.Common;

namespace PMInsight.Domain.Entities;

/// <summary>
/// ProjectResource - Pool of resources available in a project
/// Can represent system users OR placeholder resources
/// Single source of truth for resource information
/// </summary>
public class ProjectResource : TenantEntity
{
    /// <summary>
    /// Project this resource belongs to
    /// </summary>
    public required string ProjectId { get; set; }

    /// <summary>
    /// Display name of the resource
    /// Examples: "Nguyễn Văn A", "Dev 1", "Senior Backend Developer"
    /// </summary>
    public required string ResourceName { get; set; }

    /// <summary>
    /// Optional: User ID if linked to a system user
    /// Null for placeholder resources
    /// </summary>
    public string? UserId { get; set; }

    /// <summary>
    /// Role/Position of the resource
    /// Examples: "Backend Developer", "Project Manager", "Tester"
    /// </summary>
    public string? Role { get; set; }

    /// <summary>
    /// Hourly rate for cost calculation (optional)
    /// </summary>
    public decimal? HourlyRate { get; set; }

    /// <summary>
    /// Monthly capacity in hours (e.g., 160h for full-time)
    /// Used for utilization calculation
    /// </summary>
    public decimal? MonthlyCapacity { get; set; }

    /// <summary>
    /// Soft delete flag
    /// </summary>
    public bool IsActive { get; set; } = true;
}
```

**Note:** Không cần `BsonElement` attributes - MongoDB driver tự động map theo property names.

---

### **Step 2: Update ResourceAssignment to Reference Pool**

#### **2.1 Update ResourceAssignment Entity**
File: `apps/api/PMInsight.Domain/Entities/ResourceAssignment.cs`

**Changes needed:**
```csharp
public class ResourceAssignment
{
    public string Id { get; set; } = Ulid.NewUlid().ToString();

    // NEW: Reference to ProjectResource
    public required string ProjectResourceId { get; set; }

    // REMOVED: UserId, ResourceName, Role (now in ProjectResource)
    // Keep only assignment-specific fields:

    public decimal AllocationPercent { get; set; } = 100;
    public DateTime? AssignmentStartDate { get; set; }
    public DateTime? AssignmentEndDate { get; set; }
    
    public decimal EstimatedHours { get; set; }
    public decimal ActualHours { get; set; }
    public decimal? HourlyRate { get; set; }
    
    public string? Notes { get; set; }
    public bool IsPrimary { get; set; } = false;
    
    // Tracking
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string? CreatedBy { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public string? UpdatedBy { get; set; }
}
```

**Migration Strategy:**
- Keep old fields temporarily for backward compatibility
- Add new `ProjectResourceId` field
- Migration script will populate ProjectResourceId
- Remove old fields after migration is complete

---

### **Step 3: Application Layer - Commands & Queries**

#### **3.1 ProjectResource DTOs**
File: `apps/api/PMInsight.Application/ProjectResources/Dtos/ProjectResourceDtos.cs`

```csharp
namespace PMInsight.Application.ProjectResources.Dtos;

public record ProjectResourceDto
{
    public required string Id { get; init; }
    public required string ProjectId { get; init; }
    public required string ResourceName { get; init; }
    public string? UserId { get; init; }
    public string? Role { get; init; }
    public decimal? HourlyRate { get; init; }
    public decimal? MonthlyCapacity { get; init; }
    public bool IsActive { get; init; }
    
    // Utilization stats (calculated)
    public int AssignmentCount { get; init; }
    public decimal TotalAllocatedHours { get; init; }
    public decimal UtilizationPercent { get; init; }
}

public record CreateProjectResourceRequest
{
    public required string ResourceName { get; init; }
    public string? UserId { get; init; }
    public string? Role { get; init; }
    public decimal? HourlyRate { get; init; }
    public decimal? MonthlyCapacity { get; init; }
}

public record UpdateProjectResourceRequest
{
    public required string ResourceName { get; init; }
    public string? UserId { get; init; }
    public string? Role { get; init; }
    public decimal? HourlyRate { get; init; }
    public decimal? MonthlyCapacity { get; init; }
}
```

#### **3.2 Create Resource Command**
File: `apps/api/PMInsight.Application/ProjectResources/Commands/CreateProjectResourceCommand.cs`

```csharp
using MediatR;
using PMInsight.Application.Common.Interfaces;
using PMInsight.Application.ProjectResources.Dtos;
using PMInsight.Domain.Common;
using PMInsight.Domain.Entities;

namespace PMInsight.Application.ProjectResources.Commands;

public record CreateProjectResourceCommand : IRequest<ProjectResourceDto>
{
    public required string ProjectId { get; init; }
    public required CreateProjectResourceRequest Request { get; init; }
}

public class CreateProjectResourceCommandHandler 
    : IRequestHandler<CreateProjectResourceCommand, ProjectResourceDto>
{
    private readonly ITenantRepository<ProjectResource> _resourceRepository;
    private readonly ITenantRepository<User> _userRepository;
    private readonly ITenantRepository<WBS> _wbsRepository;
    private readonly ICurrentUserService _currentUserService;

    public CreateProjectResourceCommandHandler(
        ITenantRepository<ProjectResource> resourceRepository,
        ITenantRepository<User> userRepository,
        ITenantRepository<WBS> wbsRepository,
        ICurrentUserService currentUserService)
    {
        _resourceRepository = resourceRepository;
        _userRepository = userRepository;
        _wbsRepository = wbsRepository;
        _currentUserService = currentUserService;
    }

    public async Task<ProjectResourceDto> Handle(
        CreateProjectResourceCommand command, 
        CancellationToken cancellationToken)
    {
        var orgId = _currentUserService.OrganizationId!;

        // Validate unique name within project
        var existing = await _resourceRepository.FindOneAsync(
            r => r.ProjectId == command.ProjectId 
                && r.ResourceName == command.Request.ResourceName 
                && r.IsActive,
            cancellationToken
        );

        if (existing != null)
        {
            throw new InvalidOperationException(
                $"Resource name '{command.Request.ResourceName}' already exists in this project."
            );
        }

        // Validate user if provided
        if (!string.IsNullOrEmpty(command.Request.UserId))
        {
            var user = await _userRepository.GetByIdAsync(
                command.Request.UserId, 
                cancellationToken
            );
            
            if (user == null)
            {
                throw new KeyNotFoundException(
                    $"User with ID '{command.Request.UserId}' not found."
                );
            }
        }

        // Create resource
        var resource = new ProjectResource
        {
            ProjectId = command.ProjectId,
            ResourceName = command.Request.ResourceName,
            UserId = command.Request.UserId,
            Role = command.Request.Role,
            HourlyRate = command.Request.HourlyRate,
            MonthlyCapacity = command.Request.MonthlyCapacity,
            OrganizationId = orgId,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = _currentUserService.UserId
        };

        var created = await _resourceRepository.CreateAsync(resource, cancellationToken);

        return MapToDto(created, 0, 0m, 0m);
    }

    private static ProjectResourceDto MapToDto(
        ProjectResource resource, 
        int assignmentCount, 
        decimal totalHours, 
        decimal utilization)
    {
        return new ProjectResourceDto
        {
            Id = resource.Id,
            ProjectId = resource.ProjectId,
            ResourceName = resource.ResourceName,
            UserId = resource.UserId,
            Role = resource.Role,
            HourlyRate = resource.HourlyRate,
            MonthlyCapacity = resource.MonthlyCapacity,
            IsActive = resource.IsActive,
            AssignmentCount = assignmentCount,
            TotalAllocatedHours = totalHours,
            UtilizationPercent = utilization
        };
    }
}
```

#### **3.3 Update Resource Command**
File: `apps/api/PMInsight.Application/ProjectResources/Commands/UpdateProjectResourceCommand.cs`

```csharp
using MediatR;
using PMInsight.Application.Common.Interfaces;
using PMInsight.Application.ProjectResources.Dtos;
using PMInsight.Domain.Common;
using PMInsight.Domain.Entities;

namespace PMInsight.Application.ProjectResources.Commands;

public record UpdateProjectResourceCommand : IRequest<ProjectResourceDto>
{
    public required string ResourceId { get; init; }
    public required UpdateProjectResourceRequest Request { get; init; }
}

public class UpdateProjectResourceCommandHandler 
    : IRequestHandler<UpdateProjectResourceCommand, ProjectResourceDto>
{
    private readonly ITenantRepository<ProjectResource> _resourceRepository;
    private readonly ITenantRepository<User> _userRepository;
    private readonly ITenantRepository<WBS> _wbsRepository;
    private readonly ICurrentUserService _currentUserService;

    public UpdateProjectResourceCommandHandler(
        ITenantRepository<ProjectResource> resourceRepository,
        ITenantRepository<User> userRepository,
        ITenantRepository<WBS> wbsRepository,
        ICurrentUserService currentUserService)
    {
        _resourceRepository = resourceRepository;
        _userRepository = userRepository;
        _wbsRepository = wbsRepository;
        _currentUserService = currentUserService;
    }

    public async Task<ProjectResourceDto> Handle(
        UpdateProjectResourceCommand command, 
        CancellationToken cancellationToken)
    {
        var resource = await _resourceRepository.GetByIdAsync(
            command.ResourceId, 
            cancellationToken
        );

        if (resource == null)
        {
            throw new KeyNotFoundException(
                $"Project resource with ID '{command.ResourceId}' not found."
            );
        }

        // Validate unique name if changed
        if (resource.ResourceName != command.Request.ResourceName)
        {
            var existing = await _resourceRepository.FindOneAsync(
                r => r.ProjectId == resource.ProjectId 
                    && r.ResourceName == command.Request.ResourceName 
                    && r.Id != command.ResourceId
                    && r.IsActive,
                cancellationToken
            );

            if (existing != null)
            {
                throw new InvalidOperationException(
                    $"Resource name '{command.Request.ResourceName}' already exists in this project."
                );
            }
        }

        // Validate user if provided
        if (!string.IsNullOrEmpty(command.Request.UserId))
        {
            var user = await _userRepository.GetByIdAsync(
                command.Request.UserId, 
                cancellationToken
            );
            
            if (user == null)
            {
                throw new KeyNotFoundException(
                    $"User with ID '{command.Request.UserId}' not found."
                );
            }
        }

        // Update resource
        resource.ResourceName = command.Request.ResourceName;
        resource.UserId = command.Request.UserId;
        resource.Role = command.Request.Role;
        resource.HourlyRate = command.Request.HourlyRate;
        resource.MonthlyCapacity = command.Request.MonthlyCapacity;
        resource.UpdatedAt = DateTime.UtcNow;
        resource.UpdatedBy = _currentUserService.UserId;

        await _resourceRepository.UpdateAsync(command.ResourceId, resource, cancellationToken);

        // Calculate utilization
        var utilization = await CalculateUtilizationAsync(
            resource.Id, 
            resource.ProjectId, 
            resource.MonthlyCapacity,
            cancellationToken
        );

        return new ProjectResourceDto
        {
            Id = resource.Id,
            ProjectId = resource.ProjectId,
            ResourceName = resource.ResourceName,
            UserId = resource.UserId,
            Role = resource.Role,
            HourlyRate = resource.HourlyRate,
            MonthlyCapacity = resource.MonthlyCapacity,
            IsActive = resource.IsActive,
            AssignmentCount = utilization.Count,
            TotalAllocatedHours = utilization.TotalHours,
            UtilizationPercent = utilization.Percent
        };
    }

    private async Task<(int Count, decimal TotalHours, decimal Percent)> CalculateUtilizationAsync(
        string resourceId, 
        string projectId, 
        decimal? monthlyCapacity,
        CancellationToken cancellationToken)
    {
        var wbsList = await _wbsRepository.FindAsync(
            w => w.ProjectId == projectId, 
            cancellationToken
        );

        var assignments = wbsList
            .SelectMany(w => w.Tree)
            .SelectMany(n => n.ResourceAssignments)
            .Where(a => a.ProjectResourceId == resourceId)
            .ToList();

        var totalHours = assignments.Sum(a => a.EstimatedHours);
        var percent = monthlyCapacity.HasValue && monthlyCapacity > 0
            ? (totalHours / monthlyCapacity.Value) * 100
            : 0;

        return (assignments.Count, totalHours, Math.Round(percent, 1));
    }
}
```

#### **3.4 Delete Resource Command**
File: `apps/api/PMInsight.Application/ProjectResources/Commands/DeleteProjectResourceCommand.cs`

```csharp
using MediatR;
using PMInsight.Application.Common.Interfaces;
using PMInsight.Domain.Common;
using PMInsight.Domain.Entities;

namespace PMInsight.Application.ProjectResources.Commands;

public record DeleteProjectResourceCommand : IRequest
{
    public required string ResourceId { get; init; }
}

public class DeleteProjectResourceCommandHandler 
    : IRequestHandler<DeleteProjectResourceCommand>
{
    private readonly ITenantRepository<ProjectResource> _resourceRepository;
    private readonly ITenantRepository<WBS> _wbsRepository;

    public DeleteProjectResourceCommandHandler(
        ITenantRepository<ProjectResource> resourceRepository,
        ITenantRepository<WBS> wbsRepository)
    {
        _resourceRepository = resourceRepository;
        _wbsRepository = wbsRepository;
    }

    public async Task Handle(
        DeleteProjectResourceCommand command, 
        CancellationToken cancellationToken)
    {
        var resource = await _resourceRepository.GetByIdAsync(
            command.ResourceId, 
            cancellationToken
        );

        if (resource == null)
        {
            throw new KeyNotFoundException(
                $"Project resource with ID '{command.ResourceId}' not found."
            );
        }

        // Check if resource is assigned to any tasks
        var wbsList = await _wbsRepository.FindAsync(
            w => w.ProjectId == resource.ProjectId, 
            cancellationToken
        );

        var hasAssignments = wbsList
            .SelectMany(w => w.Tree)
            .SelectMany(n => n.ResourceAssignments)
            .Any(a => a.ProjectResourceId == command.ResourceId);

        if (hasAssignments)
        {
            throw new InvalidOperationException(
                $"Cannot delete resource '{resource.ResourceName}' because it is assigned to one or more tasks. " +
                "Please remove all assignments first."
            );
        }

        // Soft delete
        resource.IsActive = false;
        resource.UpdatedAt = DateTime.UtcNow;
        await _resourceRepository.UpdateAsync(command.ResourceId, resource, cancellationToken);
    }
}
```

#### **3.5 Get Resources Query**
File: `apps/api/PMInsight.Application/ProjectResources/Queries/GetProjectResourcesQuery.cs`

```csharp
using MediatR;
using PMInsight.Application.Common.Interfaces;
using PMInsight.Application.ProjectResources.Dtos;
using PMInsight.Domain.Common;
using PMInsight.Domain.Entities;

namespace PMInsight.Application.ProjectResources.Queries;

public record GetProjectResourcesQuery : IRequest<List<ProjectResourceDto>>
{
    public required string ProjectId { get; init; }
}

public class GetProjectResourcesQueryHandler 
    : IRequestHandler<GetProjectResourcesQuery, List<ProjectResourceDto>>
{
    private readonly ITenantRepository<ProjectResource> _resourceRepository;
    private readonly ITenantRepository<WBS> _wbsRepository;

    public GetProjectResourcesQueryHandler(
        ITenantRepository<ProjectResource> resourceRepository,
        ITenantRepository<WBS> wbsRepository)
    {
        _resourceRepository = resourceRepository;
        _wbsRepository = wbsRepository;
    }

    public async Task<List<ProjectResourceDto>> Handle(
        GetProjectResourcesQuery query, 
        CancellationToken cancellationToken)
    {
        // Get all active resources for project
        var resources = await _resourceRepository.FindAsync(
            r => r.ProjectId == query.ProjectId && r.IsActive, 
            cancellationToken
        );

        // Get all WBS to calculate utilization
        var wbsList = await _wbsRepository.FindAsync(
            w => w.ProjectId == query.ProjectId, 
            cancellationToken
        );
        
        var allAssignments = wbsList
            .SelectMany(w => w.Tree)
            .SelectMany(n => n.ResourceAssignments)
            .ToList();

        // Map with utilization stats
        var dtos = resources.Select(resource =>
        {
            var assignments = allAssignments
                .Where(a => a.ProjectResourceId == resource.Id)
                .ToList();

            var totalHours = assignments.Sum(a => a.EstimatedHours);
            var utilization = resource.MonthlyCapacity.HasValue && resource.MonthlyCapacity > 0
                ? (totalHours / resource.MonthlyCapacity.Value) * 100
                : 0;

            return new ProjectResourceDto
            {
                Id = resource.Id,
                ProjectId = resource.ProjectId,
                ResourceName = resource.ResourceName,
                UserId = resource.UserId,
                Role = resource.Role,
                HourlyRate = resource.HourlyRate,
                MonthlyCapacity = resource.MonthlyCapacity,
                IsActive = resource.IsActive,
                AssignmentCount = assignments.Count,
                TotalAllocatedHours = totalHours,
                UtilizationPercent = Math.Round(utilization, 1)
            };
        })
        .OrderBy(r => r.ResourceName)
        .ToList();

        return dtos;
    }
}
```

---

### **Step 4: Update Existing ResourceAssignment Commands**

#### **4.1 Update Add ResourceAssignment Handler**
File: `apps/api/PMInsight.Application/Resources/Commands/AddResourceAssignmentCommandHandler.cs`

**Changes:**
```csharp
// Updated DTO
public record AddResourceAssignmentRequest
{
    public required string ProjectResourceId { get; init; } // NEW: Changed from UserId/ResourceName
    public decimal AllocationPercent { get; init; } = 100m;
    public required decimal EstimatedHours { get; init; }
    public DateTime? AssignmentStartDate { get; init; }
    public DateTime? AssignmentEndDate { get; init; }
    public string? Notes { get; init; }
}

// Updated Handler logic
public async Task<ResourceAssignmentDto> Handle(...)
{
    // 1. Validate ProjectResource exists
    var projectResource = await _resourceRepository.GetByIdAsync(
        command.Request.ProjectResourceId, 
        cancellationToken
    );

    if (projectResource == null)
    {
        throw new KeyNotFoundException(
            $"Project resource with ID '{command.Request.ProjectResourceId}' not found."
        );
    }

    // 2. Create assignment with ProjectResourceId
    var assignment = new ResourceAssignment
    {
        ProjectResourceId = command.Request.ProjectResourceId,
        AllocationPercent = command.Request.AllocationPercent,
        EstimatedHours = command.Request.EstimatedHours,
        AssignmentStartDate = command.Request.AssignmentStartDate,
        AssignmentEndDate = command.Request.AssignmentEndDate,
        Notes = command.Request.Notes,
        CreatedAt = DateTime.UtcNow,
        CreatedBy = _currentUserService.UserId
    };

    // 3. Add to WBS node (existing logic)
    var wbs = await _wbsRepository.GetByIdAsync(command.WBSId, cancellationToken);
    var node = FindNode(wbs.Tree, command.NodeId);
    node.ResourceAssignments.Add(assignment);
    await _wbsRepository.UpdateAsync(command.WBSId, wbs, cancellationToken);

    // 4. Return DTO with resource info populated
    return new ResourceAssignmentDto
    {
        Id = assignment.Id,
        ProjectResourceId = projectResource.Id,
        ResourceName = projectResource.ResourceName,
        UserId = projectResource.UserId,
        Role = projectResource.Role,
        AllocationPercent = assignment.AllocationPercent,
        EstimatedHours = assignment.EstimatedHours,
        ActualHours = assignment.ActualHours,
        AssignmentStartDate = assignment.AssignmentStartDate,
        AssignmentEndDate = assignment.AssignmentEndDate,
        Notes = assignment.Notes
    };
}
```

#### **4.2 Update Update ResourceAssignment Handler**
File: `apps/api/PMInsight.Application/Resources/Commands/UpdateResourceAssignmentCommandHandler.cs`

**Changes:**
```csharp
// Updated DTO
public record UpdateResourceAssignmentRequest
{
    public required string ProjectResourceId { get; init; } // Can change resource
    public decimal AllocationPercent { get; init; } = 100m;
    public required decimal EstimatedHours { get; init; }
    public DateTime? AssignmentStartDate { get; init; }
    public DateTime? AssignmentEndDate { get; init; }
    public string? Notes { get; init; }
}

// Handler validates new ProjectResourceId
public async Task<ResourceAssignmentDto> Handle(...)
{
    // Validate ProjectResource exists
    var projectResource = await _resourceRepository.GetByIdAsync(
        command.Request.ProjectResourceId, 
        cancellationToken
    );

    if (projectResource == null)
    {
        throw new KeyNotFoundException(
            $"Project resource with ID '{command.Request.ProjectResourceId}' not found."
        );
    }

    // Find and update assignment
    var assignment = FindAssignment(wbs.Tree, command.NodeId, command.AssignmentId);
    assignment.ProjectResourceId = command.Request.ProjectResourceId;
    assignment.AllocationPercent = command.Request.AllocationPercent;
    assignment.EstimatedHours = command.Request.EstimatedHours;
    assignment.AssignmentStartDate = command.Request.AssignmentStartDate;
    assignment.AssignmentEndDate = command.Request.AssignmentEndDate;
    assignment.Notes = command.Request.Notes;
    assignment.UpdatedAt = DateTime.UtcNow;
    assignment.UpdatedBy = _currentUserService.UserId;

    await _wbsRepository.UpdateAsync(command.WBSId, wbs, cancellationToken);

    return MapToDto(assignment, projectResource);
}
```

#### **4.3 Update Remove ResourceAssignment Handler**
File: `apps/api/PMInsight.Application/Resources/Commands/RemoveResourceAssignmentCommandHandler.cs`

**No major changes needed** - Just remove assignment by ID as before.

#### **4.4 Update UpdateActualHours Handler**
File: `apps/api/PMInsight.Application/Resources/Commands/UpdateResourceActualHoursCommandHandler.cs`

**Changes:**
```csharp
// Need to fetch ProjectResource for display in response
public async Task<ResourceAssignmentDto> Handle(...)
{
    var assignment = FindAssignment(wbs.Tree, command.NodeId, command.AssignmentId);
    assignment.ActualHours = command.ActualHours;
    assignment.UpdatedAt = DateTime.UtcNow;
    assignment.UpdatedBy = _currentUserService.UserId;

    await _wbsRepository.UpdateAsync(command.WBSId, wbs, cancellationToken);

    // Fetch resource for response DTO
    var projectResource = await _resourceRepository.GetByIdAsync(
        assignment.ProjectResourceId, 
        cancellationToken
    );

    return MapToDto(assignment, projectResource);
}
```

#### **4.5 Update ResourceAssignmentDto**
File: `apps/api/PMInsight.Application/Resources/Dtos/ResourceAssignmentDtos.cs`

```csharp
public record ResourceAssignmentDto
{
    public required string Id { get; init; }
    public required string ProjectResourceId { get; init; } // NEW
    
    // Populated from ProjectResource for display
    public required string ResourceName { get; init; }
    public string? UserId { get; init; }
    public string? Role { get; init; }
    
    // Assignment-specific fields
    public decimal AllocationPercent { get; init; }
    public decimal EstimatedHours { get; init; }
    public decimal ActualHours { get; init; }
    public DateTime? AssignmentStartDate { get; init; }
    public DateTime? AssignmentEndDate { get; init; }
    public string? Notes { get; init; }
}
```

---

### **Step 5: API Controller**

#### **5.1 Create ProjectResourcesController**
File: `apps/api/PMInsight.Api/Controllers/ProjectResourcesController.cs`

```csharp
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PMInsight.Application.ProjectResources.Commands;
using PMInsight.Application.ProjectResources.Dtos;
using PMInsight.Application.ProjectResources.Queries;

namespace PMInsight.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/v1/projects/{projectId}/resources")]
public class ProjectResourcesController : ControllerBase
{
    private readonly IMediator _mediator;

    public ProjectResourcesController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>
    /// Get all resources in project pool
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<ProjectResourceDto>>> GetResources(
        string projectId,
        CancellationToken cancellationToken)
    {
        var query = new GetProjectResourcesQuery { ProjectId = projectId };
        var result = await _mediator.Send(query, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Create a new resource in project pool
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<ProjectResourceDto>> CreateResource(
        string projectId,
        [FromBody] CreateProjectResourceRequest request,
        CancellationToken cancellationToken)
    {
        var command = new CreateProjectResourceCommand 
        { 
            ProjectId = projectId, 
            Request = request 
        };
        var result = await _mediator.Send(command, cancellationToken);
        return CreatedAtAction(
            nameof(GetResources), 
            new { projectId }, 
            result
        );
    }

    /// <summary>
    /// Update an existing resource in project pool
    /// </summary>
    [HttpPut("{resourceId}")]
    public async Task<ActionResult<ProjectResourceDto>> UpdateResource(
        string projectId,
        string resourceId,
        [FromBody] UpdateProjectResourceRequest request,
        CancellationToken cancellationToken)
    {
        var command = new UpdateProjectResourceCommand 
        { 
            ResourceId = resourceId, 
            Request = request 
        };
        var result = await _mediator.Send(command, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Delete a resource from project pool
    /// Fails if resource is assigned to any tasks
    /// </summary>
    [HttpDelete("{resourceId}")]
    public async Task<ActionResult> DeleteResource(
        string projectId, 
        string resourceId,
        CancellationToken cancellationToken)
    {
        var command = new DeleteProjectResourceCommand { ResourceId = resourceId };
        await _mediator.Send(command, cancellationToken);
        return NoContent();
    }
}
```

---

### **Step 6: Dependency Registration**

#### **6.1 Register Repository in DI**
File: `apps/api/PMInsight.Api/Program.cs` or `ServiceCollectionExtensions.cs`

```csharp
// Register ProjectResource repository
services.AddScoped<ITenantRepository<ProjectResource>>(sp =>
{
    var context = sp.GetRequiredService<IMongoContext>();
    var currentUser = sp.GetRequiredService<ICurrentUserService>();
    return new TenantRepository<ProjectResource>(
        context, 
        currentUser.OrganizationId!, 
        "project_resources" // Collection name
    );
});
```

#### **6.2 Create MongoDB Indexes**
File: `apps/api/PMInsight.Infrastructure/Persistence/MongoDbIndexInitializer.cs`

```csharp
// Add to existing index creation
public async Task InitializeIndexesAsync()
{
    // ... existing indexes ...

    // ProjectResource indexes
    var projectResourceCollection = _database.GetCollection<ProjectResource>("project_resources");
    
    // Index on ProjectId + ResourceName (for uniqueness check)
    await projectResourceCollection.Indexes.CreateOneAsync(
        new CreateIndexModel<ProjectResource>(
            Builders<ProjectResource>.IndexKeys
                .Ascending(r => r.ProjectId)
                .Ascending(r => r.ResourceName),
            new CreateIndexOptions 
            { 
                Name = "idx_project_name",
                Unique = false // Not globally unique, but checked in code per project
            }
        )
    );

    // Index on ProjectId + IsActive (for queries)
    await projectResourceCollection.Indexes.CreateOneAsync(
        new CreateIndexModel<ProjectResource>(
            Builders<ProjectResource>.IndexKeys
                .Ascending(r => r.ProjectId)
                .Ascending(r => r.IsActive),
            new CreateIndexOptions { Name = "idx_project_active" }
        )
    );

    // Index on UserId (for user-linked resources)
    await projectResourceCollection.Indexes.CreateOneAsync(
        new CreateIndexModel<ProjectResource>(
            Builders<ProjectResource>.IndexKeys.Ascending(r => r.UserId),
            new CreateIndexOptions { Name = "idx_user", Sparse = true }
        )
    );
}
```

---

### **Step 5: Frontend Implementation**

#### **5.1 Types**
File: `features/resources/types/index.ts`

```typescript
export interface ProjectResource {
  id: string;
  projectId: string;
  resourceName: string;
  userId?: string | null;
  role?: string;
  hourlyRate?: number;
  monthlyCapacity?: number;
  isActive: boolean;
  
  // Utilization stats
  assignmentCount: number;
  totalAllocatedHours: number;
  utilizationPercent: number;
}

export interface ResourceAssignment {
  id: string;
  projectResourceId: string; // Changed from userId
  resourceName: string; // Populated from ProjectResource
  userId?: string | null; // Populated from ProjectResource
  role?: string; // Populated from ProjectResource
  allocationPercent: number;
  estimatedHours: number;
  actualHours: number;
  startDate?: string;
  endDate?: string;
  notes?: string;
}

export interface AddResourceAssignmentRequest {
  projectResourceId: string; // Changed
  allocationPercent: number;
  estimatedHours: number;
  startDate?: string;
  endDate?: string;
  notes?: string;
}
```

#### **5.2 API Service**
File: `features/resources/api/projectResourceApi.ts`

```typescript
export const projectResourceApi = {
  async getAll(projectId: string) {
    const { data } = await apiClient.get<ProjectResource[]>(
      `/api/v1/projects/${projectId}/resources`
    );
    return data;
  },

  async create(projectId: string, request: CreateProjectResourceRequest) {
    const { data } = await apiClient.post<ProjectResource>(
      `/api/v1/projects/${projectId}/resources`,
      request
    );
    return data;
  },

  async update(projectId: string, resourceId: string, request: UpdateProjectResourceRequest) {
    const { data } = await apiClient.put<ProjectResource>(
      `/api/v1/projects/${projectId}/resources/${resourceId}`,
      request
    );
    return data;
  },

  async delete(projectId: string, resourceId: string) {
    await apiClient.delete(`/api/v1/projects/${projectId}/resources/${resourceId}`);
  }
};
```

#### **5.3 Resource Pool Dialog**
File: `features/resources/components/ResourcePoolDialog.tsx`

```typescript
export function ResourcePoolDialog({ projectId, open, onOpenChange }: Props) {
  const [resources, setResources] = useState<ProjectResource[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (open) {
      loadResources();
    }
  }, [open, projectId]);

  const loadResources = async () => {
    const data = await projectResourceApi.getAll(projectId);
    setResources(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Resource Pool</DialogTitle>
          <DialogDescription>
            Manage project resources and track utilization
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Resource
          </Button>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Utilization</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {resources.map(resource => (
                <TableRow key={resource.id}>
                  <TableCell className="font-medium">
                    {resource.userId ? (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {resource.resourceName}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Placeholder</Badge>
                        {resource.resourceName}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>{resource.role || '-'}</TableCell>
                  <TableCell>
                    {resource.userId ? 'System User' : 'Placeholder'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress 
                        value={resource.utilizationPercent} 
                        className="w-24"
                      />
                      <span className="text-sm">
                        {resource.utilizationPercent}%
                      </span>
                    </div>
                    {resource.monthlyCapacity && (
                      <div className="text-xs text-gray-500">
                        {resource.totalAllocatedHours}h / {resource.monthlyCapacity}h
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {resource.assignmentCount} tasks
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => handleEdit(resource)}>
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDelete(resource.id)}
                          className="text-red-600"
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

#### **5.4 Updated EditResourcesDialog**
File: `features/resources/components/EditResourcesDialog.tsx`

```typescript
export function EditResourcesDialog({ 
  wbsId, 
  nodeId, 
  projectId,
  assignments,
  open, 
  onOpenChange 
}: Props) {
  const [resources, setResources] = useState<ProjectResource[]>([]);
  const [selectedResourceId, setSelectedResourceId] = useState<string>('');

  useEffect(() => {
    if (open) {
      loadResources();
    }
  }, [open, projectId]);

  const loadResources = async () => {
    const data = await projectResourceApi.getAll(projectId);
    setResources(data);
  };

  const handleAdd = async (values: FormValues) => {
    const request: AddResourceAssignmentRequest = {
      projectResourceId: values.projectResourceId,
      allocationPercent: values.allocationPercent,
      estimatedHours: values.estimatedHours,
      startDate: values.startDate,
      endDate: values.endDate
    };

    await resourceAssignmentApi.add(wbsId, nodeId, request);
    onSuccess();
  };

  const selectedResource = resources.find(r => r.id === selectedResourceId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manage Resources</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Select Resource</Label>
            <Select value={selectedResourceId} onValueChange={setSelectedResourceId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose from pool..." />
              </SelectTrigger>
              <SelectContent>
                {resources.map(resource => (
                  <SelectItem key={resource.id} value={resource.id}>
                    <div className="flex items-center gap-2">
                      {resource.userId ? (
                        <User className="h-4 w-4" />
                      ) : (
                        <Badge variant="outline" className="text-xs">P</Badge>
                      )}
                      <span>{resource.resourceName}</span>
                      {resource.role && (
                        <span className="text-sm text-gray-500">- {resource.role}</span>
                      )}
                      <span className="text-xs text-gray-400">
                        ({resource.utilizationPercent}% utilized)
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedResource && selectedResource.utilizationPercent > 90 && (
              <Alert variant="warning" className="mt-2">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  This resource is {selectedResource.utilizationPercent}% utilized.
                  Consider capacity before assigning.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <div>
            <Label>Allocation %</Label>
            <Input
              type="number"
              defaultValue={100}
              min={0}
              max={100}
            />
          </div>

          <div>
            <Label>Estimated Hours</Label>
            <Input type="number" />
          </div>

          <Button onClick={handleAdd}>Assign Resource</Button>
        </div>

        {/* Existing assignments list */}
        <div className="mt-6">
          <h4 className="font-medium mb-2">Assigned Resources</h4>
          {assignments.map(assignment => (
            <ResourceAssignmentRow key={assignment.id} assignment={assignment} />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

---

### **Step 6: Data Migration**

#### **6.1 Migration Script**
File: `scripts/migrate-to-resource-pool.js`

```javascript
// MongoDB migration script
db = db.getSiblingDB('pminsight');

// Step 1: Create ProjectResources from existing assignments
const wbsList = db.wbs_structures.find({});

const resourceMap = new Map(); // key: "projectId|resourceName"

wbsList.forEach(wbs => {
  wbs.tree.forEach(node => {
    (node.resourceAssignments || []).forEach(assignment => {
      const key = `${wbs.projectId}|${assignment.resourceName}`;
      
      if (!resourceMap.has(key)) {
        const resourceDoc = {
          _id: ObjectId(),
          projectId: wbs.projectId,
          tenantId: wbs.tenantId,
          resourceName: assignment.resourceName,
          userId: assignment.userId || null,
          role: assignment.role || null,
          isActive: true,
          createdAt: new Date()
        };
        
        db.project_resources.insertOne(resourceDoc);
        resourceMap.set(key, resourceDoc._id);
      }
    });
  });
});

// Step 2: Update ResourceAssignments to reference ProjectResources
wbsList.forEach(wbs => {
  const updated = wbs;
  let hasChanges = false;

  updated.tree.forEach(node => {
    node.resourceAssignments = (node.resourceAssignments || []).map(assignment => {
      const key = `${wbs.projectId}|${assignment.resourceName}`;
      const resourceId = resourceMap.get(key);

      if (resourceId) {
        hasChanges = true;
        // Keep only assignment-specific fields
        return {
          id: assignment.id,
          projectResourceId: resourceId,
          allocationPercent: assignment.allocationPercent,
          estimatedHours: assignment.estimatedHours,
          actualHours: assignment.actualHours,
          startDate: assignment.startDate,
          endDate: assignment.endDate,
          notes: assignment.notes,
          createdAt: assignment.createdAt,
          updatedAt: assignment.updatedAt
        };
      }
      return assignment;
    });
  });

  if (hasChanges) {
    db.wbs_structures.replaceOne({ _id: wbs._id }, updated);
  }
});

print('Migration completed!');
print(`Created ${resourceMap.size} project resources`);
```

---

### **Step 7: Testing Plan**

#### **7.1 Unit Tests**
- ProjectResourceRepository CRUD operations
- CreateProjectResourceCommandHandler validation
- GetProjectResourcesQueryHandler utilization calculation
- Updated ResourceAssignment handlers with ProjectResourceId

#### **7.2 Integration Tests**
- Create resource → Assign to task → Update assignment
- Delete resource with active assignments (should fail)
- Utilization calculation across multiple tasks
- Migration script accuracy

#### **7.3 E2E Tests**
- Resource Pool UI: Create/edit/delete resources
- Assignment UI: Select from pool, see warnings
- Utilization display: Check percentages
- Mixed scenario: Placeholders + users in same pool

---

## 📝 Implementation Checklist

### **Backend:**
- [ ] Create `ProjectResource` entity
- [ ] Create `IProjectResourceRepository` interface
- [ ] Implement `ProjectResourceRepository`
- [ ] Update `ResourceAssignment` entity (remove duplicate fields)
- [ ] Create ProjectResource DTOs
- [ ] Create `CreateProjectResourceCommand` + Handler
- [ ] Create `UpdateProjectResourceCommand` + Handler
- [ ] Create `DeleteProjectResourceCommand` + Handler
- [ ] Create `GetProjectResourcesQuery` + Handler
- [ ] Update `AddResourceAssignmentCommand` + Handler
- [ ] Update `UpdateResourceAssignmentCommand` + Handler
- [ ] Update `RemoveResourceAssignmentCommand` + Handler
- [ ] Update `UpdateResourceActualHoursCommand` + Handler
- [ ] Create `ProjectResourcesController`
- [ ] Register repository in DI
- [ ] Create MongoDB indexes

### **Frontend:**
- [ ] Update `ProjectResource` interface
- [ ] Update `ResourceAssignment` interface
- [ ] Update `AddResourceAssignmentRequest` interface
- [ ] Create `projectResourceApi` service
- [ ] Create `ResourcePoolDialog` component
- [ ] Update `EditResourcesDialog` (select from pool)
- [ ] Update `ResourcesColumn` (show from ProjectResource)
- [ ] Add utilization indicators
- [ ] Add capacity warnings
- [ ] Update all resource-related queries/mutations

### **Migration:**
- [ ] Write migration script
- [ ] Test on staging data
- [ ] Backup production database
- [ ] Run migration
- [ ] Verify data integrity
- [ ] Test all resource features post-migration

### **Documentation:**
- [ ] API documentation updates
- [ ] User guide for Resource Pool
- [ ] Migration guide
- [ ] Troubleshooting guide

---

## 📊 Expected Timeline

- **Week 1:** Backend (Entity, Repository, Commands, Queries)
- **Week 2:** Frontend (Components, API integration, UI polish)
- **Week 3:** Migration script, Testing, Bug fixes
- **Week 4:** Documentation, User acceptance testing

**Total:** 3-4 weeks for full implementation

---

## ✅ Success Metrics

1. **Data Integrity:** No duplicate resource entries per project
2. **Performance:** Resource pool loads <500ms for 100+ resources
3. **Utilization Accuracy:** Calculated utilization matches manual calculation
4. **User Adoption:** PM uses pool instead of creating duplicates
5. **Migration Success:** 100% of existing assignments migrated correctly

---

**Status:** ✅ Ready to implement Phase 2 - Resource Pool Pattern! 🚀
