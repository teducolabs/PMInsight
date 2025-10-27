using MediatR;
using PMInsight.Domain.Enums;

namespace PMInsight.Application.Activities.Commands;

public record AddDependencyCommand : IRequest<Unit>
{
    public required string ProjectId { get; init; }
    public required string SuccessorId { get; init; }
    public required string PredecessorId { get; init; }
    public DependencyType Type { get; init; } = DependencyType.FS;
    public int LagDays { get; init; } = 0;
}
