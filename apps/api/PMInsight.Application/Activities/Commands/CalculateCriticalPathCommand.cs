using MediatR;

namespace PMInsight.Application.Activities.Commands;

public record CalculateCriticalPathCommand : IRequest<Unit>
{
    public required string ProjectId { get; init; }
}
