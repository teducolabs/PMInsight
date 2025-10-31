using PMInsight.Domain.Entities;
using PMInsight.Domain.Enums;

namespace PMInsight.Api.Models;

/// <summary>
/// Request model for creating WBS
/// </summary>
public record CreateWBSRequest
{
    public required string ProjectId { get; init; }
    public List<WBSNode> Tree { get; init; } = new();
}

/// <summary>
/// Request model for updating WBS
/// </summary>
public record UpdateWBSRequest
{
    public List<WBSNode> Tree { get; init; } = new();
}

/// <summary>
/// Request model for creating a new WBS node
/// </summary>
public record CreateWBSNodeRequest
{
    public required string Name { get; init; }
    public string? Code { get; init; }
    public string? Description { get; init; }
    public WBSNodeType Type { get; init; } = WBSNodeType.Task;
    public string? ParentNodeId { get; init; }
    
    // Schedule
    public DateTime? PlannedStartDate { get; init; }
    public DateTime? PlannedEndDate { get; init; }
    public int? DurationDays { get; init; }
    
    // Resources
    public List<string>? AssignedUserIds { get; init; }
    public decimal? EstimatedHours { get; init; }
    public decimal? PlannedCost { get; init; }
}

/// <summary>
/// Request model for inserting a new WBS node at a specific position
/// Supports MS Project-style insert operations
/// </summary>
public record InsertWBSNodeRequest
{
    public required string TargetNodeId { get; init; }
    public InsertPosition Position { get; init; } = InsertPosition.Below;
    
    public required string Name { get; init; }
    public string? Code { get; init; }
    public string? Description { get; init; }
    public WBSNodeType Type { get; init; } = WBSNodeType.Task;
    
    // Schedule
    public DateTime? PlannedStartDate { get; init; }
    public DateTime? PlannedEndDate { get; init; }
    public int? DurationDays { get; init; }
    
    // Resources
    public List<string>? AssignedUserIds { get; init; }
    public decimal? EstimatedHours { get; init; }
    public decimal? PlannedCost { get; init; }
}

/// <summary>
/// Request model for updating a WBS node
/// </summary>
public record UpdateWBSNodeRequest
{
    public string? Name { get; init; }
    public string? Description { get; init; }
    public WBSNodeType? Type { get; init; }
    public ScheduleMode? ScheduleMode { get; init; }
    
    // Schedule
    public DateTime? PlannedStartDate { get; init; }
    public DateTime? PlannedEndDate { get; init; }
    public int? DurationDays { get; init; }
    public DateTime? ActualStartDate { get; init; }
    public DateTime? ActualEndDate { get; init; }
    
    // Progress
    public int? PercentComplete { get; init; }
    public ActivityStatus? Status { get; init; }
    
    // Resources
    public List<string>? AssignedUserIds { get; init; }
    public decimal? EstimatedHours { get; init; }
    public decimal? ActualHours { get; init; }
    public decimal? PlannedCost { get; init; }
    public decimal? ActualCost { get; init; }
    
    // Dependencies
    public List<WBSNodeDependency>? Predecessors { get; init; }
    
    // Constraints
    public WBSNodeConstraint? Constraint { get; init; }
    public TaskPriority? Priority { get; init; }
    
    // Metadata
    public string? Notes { get; init; }
}

/// <summary>
/// Request model for adding dependency
/// </summary>
public record AddDependencyRequest
{
    public required string PredecessorNodeId { get; init; }
    public required string Type { get; init; } // FS, SS, FF, SF
    public int LagDays { get; init; } = 0;
}

/// <summary>
/// Request model for updating node progress
/// </summary>
public record UpdateProgressRequest
{
    public decimal PercentComplete { get; init; }
    public DateTime? ActualStartDate { get; init; }
    public DateTime? ActualEndDate { get; init; }
    public decimal? ActualHours { get; init; }
    public decimal? ActualCost { get; init; }
}
