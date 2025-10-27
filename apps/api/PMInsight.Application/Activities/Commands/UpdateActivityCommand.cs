using MediatR;
using PMInsight.Application.Activities.Dtos;
using PMInsight.Domain.Enums;

namespace PMInsight.Application.Activities.Commands;

public record UpdateActivityCommand : IRequest<ActivityDto>
{
    public required string ProjectId { get; init; }
    public required string Id { get; init; }
    public string? Name { get; init; }
    public string? Code { get; init; }
    public string? Description { get; init; }
    public string? WbsNodeId { get; init; }
    public DateTime? PlannedStartDate { get; init; }
    public DateTime? PlannedEndDate { get; init; }
    public int? DurationDays { get; init; }
    public DateTime? ActualStartDate { get; init; }
    public DateTime? ActualEndDate { get; init; }
    public int? PercentComplete { get; init; }
    public ActivityStatus? Status { get; init; }
    public List<string>? AssignedUserIds { get; init; }
    public decimal? EstimatedHours { get; init; }
    public decimal? ActualHours { get; init; }
    public decimal? PlannedCost { get; init; }
    public decimal? ActualCost { get; init; }
    public string? Notes { get; init; }
}
