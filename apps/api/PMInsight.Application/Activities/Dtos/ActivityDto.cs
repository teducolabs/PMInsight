using PMInsight.Domain.Enums;

namespace PMInsight.Application.Activities.Dtos;

public class ActivityDto
{
    public string Id { get; set; } = string.Empty;
    public string ProjectId { get; set; } = string.Empty;
    public string? WbsNodeId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Code { get; set; }
    public string? Description { get; set; }
    
    // Schedule
    public DateTime? PlannedStartDate { get; set; }
    public DateTime? PlannedEndDate { get; set; }
    public int DurationDays { get; set; }
    public DateTime? ActualStartDate { get; set; }
    public DateTime? ActualEndDate { get; set; }
    public int? ActualDurationDays { get; set; }
    
    // Progress
    public int PercentComplete { get; set; }
    public ActivityStatus Status { get; set; }
    
    // Dependencies
    public List<ActivityDependencyDto> Predecessors { get; set; } = new();
    public List<ActivityDependencyDto> Successors { get; set; } = new();
    
    // Resources
    public List<string> AssignedUserIds { get; set; } = new();
    public List<string> AssignedUserNames { get; set; } = new();
    public decimal EstimatedHours { get; set; }
    public decimal ActualHours { get; set; }
    
    // Cost
    public decimal? PlannedCost { get; set; }
    public decimal? ActualCost { get; set; }
    
    // CPM
    public bool IsCritical { get; set; }
    public decimal TotalFloat { get; set; }
    public decimal FreeFloat { get; set; }
    public DateTime? EarlyStart { get; set; }
    public DateTime? EarlyFinish { get; set; }
    public DateTime? LateStart { get; set; }
    public DateTime? LateFinish { get; set; }
    
    // Constraint
    public ActivityConstraintDto? Constraint { get; set; }
    
    // Baseline
    public ActivityBaselineDto? Baseline { get; set; }
    
    // Metadata
    public string? Notes { get; set; }
    public List<string> Tags { get; set; } = new();
    
    // WBS Info
    public string? WbsNodeName { get; set; }
    public string? WbsNodeCode { get; set; }
    
    // Audit
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class ActivityDependencyDto
{
    public string ActivityId { get; set; } = string.Empty;
    public string ActivityName { get; set; } = string.Empty;
    public string? ActivityCode { get; set; }
    public DependencyType Type { get; set; }
    public int LagDays { get; set; }
}

public class ActivityConstraintDto
{
    public ConstraintType Type { get; set; }
    public DateTime? ConstraintDate { get; set; }
}

public class ActivityBaselineDto
{
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public int DurationDays { get; set; }
    public decimal PlannedCost { get; set; }
    public DateTime BaselineDate { get; set; }
    public string? BaselineVersion { get; set; }
}

public class CreateActivityDto
{
    public required string Name { get; set; }
    public string? Code { get; set; }
    public string? Description { get; set; }
    public string? WbsNodeId { get; set; }
    public DateTime? PlannedStartDate { get; set; }
    public DateTime? PlannedEndDate { get; set; }
    public int DurationDays { get; set; }
    public ActivityStatus Status { get; set; } = ActivityStatus.NotStarted;
    public int PercentComplete { get; set; } = 0;
    public List<string> AssignedUserIds { get; set; } = new();
    public decimal EstimatedHours { get; set; }
    public decimal? PlannedCost { get; set; }
    public ConstraintType? ConstraintType { get; set; }
    public DateTime? ConstraintDate { get; set; }
}

public class UpdateActivityDto
{
    public string? Name { get; set; }
    public string? Code { get; set; }
    public string? Description { get; set; }
    public string? WbsNodeId { get; set; }
    public DateTime? PlannedStartDate { get; set; }
    public DateTime? PlannedEndDate { get; set; }
    public int? DurationDays { get; set; }
    public DateTime? ActualStartDate { get; set; }
    public DateTime? ActualEndDate { get; set; }
    public int? PercentComplete { get; set; }
    public ActivityStatus? Status { get; set; }
    public List<string>? AssignedUserIds { get; set; }
    public decimal? EstimatedHours { get; set; }
    public decimal? ActualHours { get; set; }
    public decimal? PlannedCost { get; set; }
    public decimal? ActualCost { get; set; }
    public string? Notes { get; set; }
}

public class AddDependencyDto
{
    public required string PredecessorId { get; set; }
    public DependencyType Type { get; set; } = DependencyType.FS;
    public int LagDays { get; set; } = 0;
}
