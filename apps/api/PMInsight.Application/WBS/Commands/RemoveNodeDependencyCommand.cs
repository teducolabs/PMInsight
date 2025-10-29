using MediatR;
using PMInsight.Application.WBS.Dtos;

namespace PMInsight.Application.WBS.Commands;

/// <summary>
/// Command to remove a dependency from a WBS node
/// </summary>
public record RemoveNodeDependencyCommand : IRequest<WBSDto>
{
    public required string WBSId { get; init; }
    public required string NodeId { get; init; }
    public required string PredecessorNodeId { get; init; }
}
