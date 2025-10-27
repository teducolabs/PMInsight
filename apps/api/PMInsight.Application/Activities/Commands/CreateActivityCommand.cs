using MediatR;
using PMInsight.Application.Activities.Dtos;
using PMInsight.Domain.Enums;

namespace PMInsight.Application.Activities.Commands;

public record CreateActivityCommand : IRequest<ActivityDto>
{
    public required string ProjectId { get; init; }
    public required string Name { get; init; }
    public string? Code { get; init; }
    public string? Description { get; init; }
    public string? WbsNodeId { get; init; }
    public DateTime? PlannedStartDate { get; init; }
    public DateTime? PlannedEndDate { get; init; }
    public int DurationDays { get; init; }
    public ActivityStatus Status { get; init; } = ActivityStatus.NotStarted;
    public int PercentComplete { get; init; } = 0;
    public List<string> AssignedUserIds { get; init; } = new();
    public decimal EstimatedHours { get; init; }
    public decimal? PlannedCost { get; init; }
    public ConstraintType? ConstraintType { get; init; }
    public DateTime? ConstraintDate { get; init; }
}
