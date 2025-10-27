using PMInsight.Domain.Common;
using PMInsight.Domain.Enums;

namespace PMInsight.Domain.Entities;

/// <summary>
/// Schedule Activity - represents a distinct, scheduled portion of work performed during a project.
/// Maps to PMI's Schedule Activity concept (not to be confused with WBS Work Packages).
/// Collection name: "Activities" for consistency with PMI terminology.
/// </summary>
public class ScheduleActivity : TenantEntity
{
    public required string ProjectId { get; set; }
    
    /// <summary>
    /// Link to WBS Work Package this activity belongs to
    /// </summary>
    public string? WbsNodeId { get; set; }
    
    // Identity
    public required string Name { get; set; }
    public string? Code { get; set; }  // Activity ID (e.g., A100, A200)
    public string? Description { get; set; }
    
    // Schedule attributes (Planned)
    public DateTime? PlannedStartDate { get; set; }
    public DateTime? PlannedEndDate { get; set; }
    public int DurationDays { get; set; }  // Original duration estimate
    
    // Schedule attributes (Actual)
    public DateTime? ActualStartDate { get; set; }
    public DateTime? ActualEndDate { get; set; }
    public int? ActualDurationDays { get; set; }
    
    // Progress tracking
    public int PercentComplete { get; set; } = 0;  // 0-100
    public ActivityStatus Status { get; set; } = ActivityStatus.NotStarted;
    
    // Dependencies
    public List<ActivityDependency> Predecessors { get; set; } = new();
    public List<ActivityDependency> Successors { get; set; } = new();
    
    // Resources
    public List<string> AssignedUserIds { get; set; } = new();
    public decimal EstimatedHours { get; set; }
    public decimal ActualHours { get; set; }
    
    // Cost tracking
    public decimal? PlannedCost { get; set; }
    public decimal? ActualCost { get; set; }
    
    // Critical Path Method (CPM) calculations
    public bool IsCritical { get; set; }
    public decimal TotalFloat { get; set; }  // Total Slack
    public decimal FreeFloat { get; set; }   // Free Slack
    public DateTime? EarlyStart { get; set; }
    public DateTime? EarlyFinish { get; set; }
    public DateTime? LateStart { get; set; }
    public DateTime? LateFinish { get; set; }
    
    // Schedule constraints
    public ActivityConstraint? Constraint { get; set; }
    
    // Baseline (for performance measurement)
    public ActivityBaseline? Baseline { get; set; }
    
    // Metadata
    public string? Notes { get; set; }
    public List<string> Tags { get; set; } = new();
}

/// <summary>
/// Activity Dependency - represents relationship between two activities
/// </summary>
public class ActivityDependency
{
    public required string ActivityId { get; set; }
    public DependencyType Type { get; set; } = DependencyType.FS;
    
    /// <summary>
    /// Lag in days. Positive = lag (delay), Negative = lead (overlap)
    /// </summary>
    public int LagDays { get; set; } = 0;
}

/// <summary>
/// Schedule Constraint - limits when activity can be scheduled
/// </summary>
public class ActivityConstraint
{
    public ConstraintType Type { get; set; } = ConstraintType.ASAP;
    public DateTime? ConstraintDate { get; set; }
}

/// <summary>
/// Activity Baseline - snapshot of planned schedule for performance measurement
/// </summary>
public class ActivityBaseline
{
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public int DurationDays { get; set; }
    public decimal PlannedCost { get; set; }
    public DateTime BaselineDate { get; set; }
    public string? BaselineVersion { get; set; }
}
