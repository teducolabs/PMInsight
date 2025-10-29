using PMInsight.Domain.Common;
using PMInsight.Domain.Enums;

namespace PMInsight.Domain.Entities;

/// <summary>
/// WBS - Represents Work Breakdown Structure for a project
/// Collection name: "WBS"
/// </summary>
public class WBS : TenantEntity
{
    public required string ProjectId { get; set; }
    public List<WBSNode> Tree { get; set; } = new();
    public int Version { get; set; } = 1;
    public string? BaselineRef { get; set; }
    public string? LockedBy { get; set; }
    public DateTime? LockedAt { get; set; }
}

/// <summary>
/// WBSNode - Unified entity for both WBS structure and Schedule Activities
/// Replaces the separate WBSNode and ScheduleActivity entities
/// Maps to MS Project's unified Task structure
/// </summary>
public class WBSNode
{
    public string Id { get; set; } = Ulid.NewUlid().ToString();
    public required string Name { get; set; }
    public string? Code { get; set; }  // WBS Code (e.g., 1.1.2) or Activity ID
    public string? Description { get; set; }
    
    // ===== NODE TYPE & HIERARCHY =====
    public WBSNodeType Type { get; set; } = WBSNodeType.Summary;
    public int Level { get; set; }  // Depth in tree (1 = root)
    public int SortOrder { get; set; } = 0;
    public List<WBSNode> Children { get; set; } = new();
    
    // ===== SCHEDULE (for all types) =====
    public ScheduleMode ScheduleMode { get; set; } = ScheduleMode.Auto;
    
    // Planned schedule
    public DateTime? PlannedStartDate { get; set; }
    public DateTime? PlannedEndDate { get; set; }
    public int? DurationDays { get; set; }
    
    // Actual schedule
    public DateTime? ActualStartDate { get; set; }
    public DateTime? ActualEndDate { get; set; }
    public int? ActualDurationDays { get; set; }
    
    // Progress
    public int PercentComplete { get; set; } = 0;  // 0-100
    
    // ===== TASK-SPECIFIC (Type = Task/Milestone) =====
    public ActivityStatus Status { get; set; } = ActivityStatus.NotStarted;
    
    // Dependencies
    public List<WBSNodeDependency> Predecessors { get; set; } = new();
    public List<WBSNodeDependency> Successors { get; set; } = new();
    
    // Resources - Legacy (for backward compatibility, will be deprecated)
    public List<string> AssignedUserIds { get; set; } = new();
    
    // Resources - New detailed assignments
    public List<ResourceAssignment> ResourceAssignments { get; set; } = new();
    
    // Effort tracking (rollup from ResourceAssignments)
    public decimal EstimatedHours { get; set; } = 0;
    public decimal ActualHours { get; set; } = 0;
    
    // Cost tracking (rollup from ResourceAssignments)
    public decimal? PlannedCost { get; set; }
    public decimal? ActualCost { get; set; }
    public string? Currency { get; set; } = "VND";
    
    // Schedule constraints
    public WBSNodeConstraint? Constraint { get; set; }
    public TaskPriority Priority { get; set; } = TaskPriority.Medium;
    
    // Critical Path Method (CPM) calculations
    public bool IsCritical { get; set; }
    public decimal TotalFloat { get; set; }  // Total Slack
    public decimal FreeFloat { get; set; }   // Free Slack
    public DateTime? EarlyStart { get; set; }
    public DateTime? EarlyFinish { get; set; }
    public DateTime? LateStart { get; set; }
    public DateTime? LateFinish { get; set; }
    
    // Baseline (for performance measurement)
    public WBSNodeBaseline? Baseline { get; set; }
    
    // ===== SUMMARY-SPECIFIC (Type = Summary) =====
    public List<string> Deliverables { get; set; } = new();
    public string? AcceptanceCriteria { get; set; }
    public string? ResponsibleOrganization { get; set; }
    public string? ResponsibleUserId { get; set; }
    public List<string> Assumptions { get; set; } = new();
    public List<string> ScopeConstraints { get; set; } = new();
    
    // ===== METADATA =====
    public string? Notes { get; set; }
    public List<string> Tags { get; set; } = new();
}

/// <summary>
/// Activity Dependency - represents relationship between two activities
/// </summary>
public class WBSNodeDependency
{
    public required string NodeId { get; set; }
    public DependencyType Type { get; set; } = DependencyType.FS;
    
    /// <summary>
    /// Lag in days. Positive = lag (delay), Negative = lead (overlap)
    /// </summary>
    public int LagDays { get; set; } = 0;
}

/// <summary>
/// Schedule Constraint - limits when activity can be scheduled
/// </summary>
public class WBSNodeConstraint
{
    public ConstraintType Type { get; set; } = ConstraintType.ASAP;
    public DateTime? ConstraintDate { get; set; }
}

/// <summary>
/// WBSNode Baseline - snapshot of planned schedule for performance measurement
/// </summary>
public class WBSNodeBaseline
{
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public int DurationDays { get; set; }
    public decimal PlannedCost { get; set; }
    public DateTime BaselineDate { get; set; }
    public string? BaselineVersion { get; set; }
}
