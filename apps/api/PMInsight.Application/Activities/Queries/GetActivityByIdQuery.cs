using MediatR;
using PMInsight.Application.Activities.Dtos;

namespace PMInsight.Application.Activities.Queries;

public record GetActivityByIdQuery : IRequest<ActivityDto?>
{
    public required string ProjectId { get; init; }
    public required string Id { get; init; }
}
