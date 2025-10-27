using MediatR;
using PMInsight.Application.Activities.Dtos;

namespace PMInsight.Application.Activities.Queries;

public record GetActivitiesQuery : IRequest<List<ActivityDto>>
{
    public required string ProjectId { get; init; }
    public string? WbsNodeId { get; init; }
    public bool? IsCritical { get; init; }
}
