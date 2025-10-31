using MediatR;
using PMInsight.Application.WBS.Dtos;
using PMInsight.Domain.Enums;

namespace PMInsight.Application.WBS.Commands;

/// <summary>
/// Insert a new WBS node at a specific position relative to a target node
/// Supports MS Project-style insert operations: Above, Below, or Child
/// </summary>
public record InsertWBSNodeCommand : IRequest<WBSNodeDto>
{
    public required string WBSId { get; init; }
    
    /// <summary>
    /// Target node ID - the node relative to which we insert
    /// </summary>
    public required string TargetNodeId { get; init; }
    
    /// <summary>
    /// Insert position: Above (before target), Below (after target), or Child (as first child)
    /// </summary>
    public InsertPosition Position { get; init; }
    
    // Node properties
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
