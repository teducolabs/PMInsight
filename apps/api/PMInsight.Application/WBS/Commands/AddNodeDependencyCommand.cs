using MediatR;
using PMInsight.Application.WBS.Dtos;

namespace PMInsight.Application.WBS.Commands;

/// <summary>
/// Command to add a dependency between two WBS nodes
/// </summary>
public record AddNodeDependencyCommand : IRequest<WBSDto>
{
    public required string WBSId { get; init; }
    public required string NodeId { get; init; }
    public required string PredecessorNodeId { get; init; }
    public required string Type { get; init; } // FS, SS, FF, SF
    public int LagDays { get; init; } = 0;
}
