using PMInsight.Domain.Entities;
using PMInsight.Domain.Enums;

namespace PMInsight.Application.WBS.Dtos;

public record WBSDto
{
    public required string Id { get; init; }
    public required string ProjectId { get; init; }
    public required string OrganizationId { get; init; }
    public List<WBSNodeDto> Tree { get; init; } = new();
    public int Version { get; init; }
    public string? BaselineRef { get; init; }
    public string? LockedBy { get; init; }
    public DateTime? LockedAt { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime UpdatedAt { get; init; }
}

/// <summary>
/// WBSNodeDto - Unified DTO for both WBS structure and Schedule Activities
/// </summary>
public record WBSNodeDto
{
    public string Id { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
    public string? Code { get; init; }
    public string? Description { get; init; }
    
    // Node type & hierarchy
    public WBSNodeType Type { get; init; } = WBSNodeType.Summary;
    public int Level { get; init; }
    public int SortOrder { get; init; }
    public List<WBSNodeDto> Children { get; init; } = new();
    
    // Schedule
    public ScheduleMode ScheduleMode { get; init; } = ScheduleMode.Auto;
    public DateTime? PlannedStartDate { get; init; }
    public DateTime? PlannedEndDate { get; init; }
    public int? DurationDays { get; init; }
    public DateTime? ActualStartDate { get; init; }
    public DateTime? ActualEndDate { get; init; }
    public int? ActualDurationDays { get; init; }
    public int PercentComplete { get; init; }
    
    // Task-specific
    public ActivityStatus Status { get; init; }
    public List<ActivityDependencyDto> Predecessors { get; init; } = new();
    public List<ActivityDependencyDto> Successors { get; init; } = new();
    public List<string> AssignedUserIds { get; init; } = new();
    public List<string> AssignedUserNames { get; init; } = new();
    public decimal EstimatedHours { get; init; }
    public decimal ActualHours { get; init; }
    public decimal? PlannedCost { get; init; }
    public decimal? ActualCost { get; init; }
    public string? Currency { get; init; }
    public ActivityConstraintDto? Constraint { get; init; }
    public TaskPriority Priority { get; init; }
    
    // CPM
    public bool IsCritical { get; init; }
    public decimal TotalFloat { get; init; }
    public decimal FreeFloat { get; init; }
    public DateTime? EarlyStart { get; init; }
    public DateTime? EarlyFinish { get; init; }
    public DateTime? LateStart { get; init; }
    public DateTime? LateFinish { get; init; }
    public ActivityBaselineDto? Baseline { get; init; }
    
    // Summary-specific
    public List<string> Deliverables { get; init; } = new();
    public string? AcceptanceCriteria { get; init; }
    public string? ResponsibleOrganization { get; init; }
    public string? ResponsibleUserId { get; init; }
    public List<string> Assumptions { get; init; } = new();
    public List<string> ScopeConstraints { get; init; } = new();
    
    // Metadata
    public string? Notes { get; init; }
    public List<string> Tags { get; init; } = new();
}

public record ActivityDependencyDto
{
    public string ActivityId { get; init; } = string.Empty;
    public string ActivityName { get; init; } = string.Empty;
    public string? ActivityCode { get; init; }
    public DependencyType Type { get; init; }
    public int LagDays { get; init; }
}

public record ActivityConstraintDto
{
    public ConstraintType Type { get; init; }
    public DateTime? ConstraintDate { get; init; }
}

public record ActivityBaselineDto
{
    public DateTime StartDate { get; init; }
    public DateTime EndDate { get; init; }
    public int DurationDays { get; init; }
    public decimal PlannedCost { get; init; }
    public DateTime BaselineDate { get; init; }
    public string? BaselineVersion { get; init; }
}

// Request DTOs
public record CreateWBSNodeRequest
{
    public required string Name { get; init; }
    public string? Code { get; init; }
    public string? Description { get; init; }
    public WBSNodeType Type { get; init; } = WBSNodeType.Summary;
    public string? ParentNodeId { get; init; }
    
    // Schedule (for Task/Milestone)
    public DateTime? PlannedStartDate { get; init; }
    public DateTime? PlannedEndDate { get; init; }
    public int? DurationDays { get; init; }
    
    // Resources (for Task)
    public List<string>? AssignedUserIds { get; init; }
    public decimal? EstimatedHours { get; init; }
    public decimal? PlannedCost { get; init; }
}

public record UpdateWBSNodeRequest
{
    public string? Name { get; init; }
    public string? Description { get; init; }
    public ScheduleMode? ScheduleMode { get; init; }
    
    // Schedule
    public DateTime? PlannedStartDate { get; init; }
    public DateTime? PlannedEndDate { get; init; }
    public int? DurationDays { get; init; }
    public DateTime? ActualStartDate { get; init; }
    public DateTime? ActualEndDate { get; init; }
    public int? PercentComplete { get; init; }
    public ActivityStatus? Status { get; init; }
    public WBSNodeType Type { set; get; }
    
    // Resources
    public List<string>? AssignedUserIds { get; init; }
    public decimal? EstimatedHours { get; init; }
    public decimal? ActualHours { get; init; }
    public decimal? PlannedCost { get; init; }
    public decimal? ActualCost { get; init; }
    
    // Dependencies
    public List<ActivityDependency>? Predecessors { get; init; }
    
    // Constraint
    public ActivityConstraint? Constraint { get; init; }
    public TaskPriority? Priority { get; init; }
    
    // Notes
    public string? Notes { get; init; }
}
