using MediatR;
using PMInsight.Application.Activities.Dtos;

namespace PMInsight.Application.Activities.Queries;

public record GetCriticalPathQuery : IRequest<List<ActivityDto>>
{
    public required string ProjectId { get; init; }
}
