using MediatR;
using PMInsight.Application.WBS.Dtos;

namespace PMInsight.Application.WBS.Commands;

/// <summary>
/// Command to quickly update node progress and actuals
/// </summary>
public record UpdateNodeProgressCommand : IRequest<WBSDto>
{
    public required string WBSId { get; init; }
    public required string NodeId { get; init; }
    public decimal PercentComplete { get; init; }
    public DateTime? ActualStartDate { get; init; }
    public DateTime? ActualEndDate { get; init; }
    public decimal? ActualHours { get; init; }
    public decimal? ActualCost { get; init; }
}
