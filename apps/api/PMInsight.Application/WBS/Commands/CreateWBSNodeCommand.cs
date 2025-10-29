using MediatR;
using PMInsight.Application.WBS.Dtos;

namespace PMInsight.Application.WBS.Commands;

public record CreateWBSNodeCommand : IRequest<WBSNodeDto>
{
    public required string WBSId { get; init; }
    public required string Name { get; init; }
    public string? Code { get; init; }
    public string? Description { get; init; }
    public Domain.Enums.WBSNodeType Type { get; init; }
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
