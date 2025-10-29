using MediatR;
using PMInsight.Application.Common.Interfaces;
using PMInsight.Application.WBS.Commands;
using PMInsight.Application.WBS.Dtos;
using PMInsight.Application.WBS.Helpers;
using PMInsight.Domain.Common;
using PMInsight.Domain.Entities;

namespace PMInsight.Application.WBS.Handlers;

/// <summary>
/// Handler for adding a dependency between two nodes
/// </summary>
public class AddNodeDependencyCommandHandler : IRequestHandler<AddNodeDependencyCommand, WBSDto>
{
    private readonly IRepository<Domain.Entities.WBS> _wbsRepository;
    private readonly ICurrentUserService _currentUserService;

    public AddNodeDependencyCommandHandler(
        IRepository<Domain.Entities.WBS> wbsRepository,
        ICurrentUserService currentUserService)
    {
        _wbsRepository = wbsRepository;
        _currentUserService = currentUserService;
    }

    public async Task<WBSDto> Handle(AddNodeDependencyCommand request, CancellationToken cancellationToken)
    {
        var wbs = await _wbsRepository.GetByIdAsync(request.WBSId, cancellationToken);
        
        if (wbs == null || wbs.OrganizationId != _currentUserService.OrganizationId)
        {
            throw new UnauthorizedAccessException("WBS not found or access denied");
        }

        // Check if locked by someone else
        if (!string.IsNullOrEmpty(wbs.LockedBy) && wbs.LockedBy != _currentUserService.UserId)
        {
            throw new InvalidOperationException("WBS is locked by another user");
        }

        // Find the node
        var node = WBSMapper.FindNodeById(wbs.Tree, request.NodeId);
        if (node == null)
        {
            throw new InvalidOperationException($"Node {request.NodeId} not found");
        }

        // Validate predecessor exists
        var predecessorNode = WBSMapper.FindNodeById(wbs.Tree, request.PredecessorNodeId);
        if (predecessorNode == null)
        {
            throw new InvalidOperationException($"Predecessor node {request.PredecessorNodeId} not found");
        }

        // Validate dependency type
        if (!Enum.TryParse<Domain.Enums.DependencyType>(request.Type, out var dependencyType))
        {
            throw new ArgumentException($"Invalid dependency type: {request.Type}");
        }

        // Check if dependency already exists
        if (node.Predecessors.Any(p => p.NodeId == request.PredecessorNodeId))
        {
            throw new InvalidOperationException("Dependency already exists");
        }

        // Check for circular dependencies
        if (WouldCreateCircularDependency(wbs.Tree, request.NodeId, request.PredecessorNodeId))
        {
            throw new InvalidOperationException("Cannot add dependency: would create circular dependency");
        }

        // Add the dependency
        node.Predecessors.Add(new ActivityDependency
        {
            NodeId = request.PredecessorNodeId,
            Type = dependencyType,
            LagDays = request.LagDays
        });

        // Also add to predecessor's successors list
        predecessorNode.Successors.Add(new ActivityDependency
        {
            NodeId = request.NodeId,
            Type = dependencyType,
            LagDays = request.LagDays
        });

        // Recalculate critical path
        CriticalPathCalculator.CalculateCriticalPath(wbs.Tree);

        // Increment version and save
        wbs.Version++;
        await _wbsRepository.UpdateAsync(wbs.Id, wbs, cancellationToken);

        return WBSMapper.MapToDto(wbs);
    }

    private bool WouldCreateCircularDependency(List<WBSNode> tree, string nodeId, string predecessorId)
    {
        // If predecessor depends on node (directly or indirectly), adding this dependency would create a cycle
        var predecessorNode = WBSMapper.FindNodeById(tree, predecessorId);
        if (predecessorNode == null) return false;

        var visited = new HashSet<string>();
        return HasPathTo(tree, predecessorNode, nodeId, visited);
    }

    private bool HasPathTo(List<WBSNode> tree, WBSNode from, string targetId, HashSet<string> visited)
    {
        if (from.Id == targetId) return true;
        if (visited.Contains(from.Id)) return false;

        visited.Add(from.Id);

        foreach (var pred in from.Predecessors)
        {
            var predNode = WBSMapper.FindNodeById(tree, pred.NodeId);
            if (predNode != null && HasPathTo(tree, predNode, targetId, visited))
                return true;
        }

        return false;
    }
}
