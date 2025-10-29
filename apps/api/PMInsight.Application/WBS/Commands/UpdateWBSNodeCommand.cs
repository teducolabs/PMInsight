using MediatR;
using PMInsight.Application.WBS.Dtos;
using PMInsight.Domain.Entities;
using PMInsight.Domain.Enums;

namespace PMInsight.Application.WBS.Commands;

public record UpdateWBSNodeCommand : IRequest<WBSNodeDto>
{
    public required string WBSId { get; init; }
    public required string NodeId { get; init; }
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
