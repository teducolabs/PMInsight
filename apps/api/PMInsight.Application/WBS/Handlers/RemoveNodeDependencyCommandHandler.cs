using MediatR;
using PMInsight.Application.Common.Interfaces;
using PMInsight.Application.WBS.Commands;
using PMInsight.Application.WBS.Dtos;
using PMInsight.Application.WBS.Helpers;
using PMInsight.Domain.Common;

namespace PMInsight.Application.WBS.Handlers;

/// <summary>
/// Handler for removing a dependency from a node
/// </summary>
public class RemoveNodeDependencyCommandHandler
    : IRequestHandler<RemoveNodeDependencyCommand, WBSDto>
{
    private readonly IRepository<Domain.Entities.WBS> _wbsRepository;
    private readonly ICurrentUserService _currentUserService;

    public RemoveNodeDependencyCommandHandler(
        IRepository<Domain.Entities.WBS> wbsRepository,
        ICurrentUserService currentUserService
    )
    {
        _wbsRepository = wbsRepository;
        _currentUserService = currentUserService;
    }

    public async Task<WBSDto> Handle(
        RemoveNodeDependencyCommand request,
        CancellationToken cancellationToken
    )
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

        // Find and remove the dependency
        var dependency = node.Predecessors.FirstOrDefault(p =>
            p.NodeId == request.PredecessorNodeId
        );
        if (dependency == null)
        {
            throw new InvalidOperationException(
                $"Dependency to {request.PredecessorNodeId} not found"
            );
        }

        node.Predecessors.Remove(dependency);

        // Also remove from predecessor's successors list
        var predecessorNode = WBSMapper.FindNodeById(wbs.Tree, request.PredecessorNodeId);
        if (predecessorNode != null)
        {
            var successorDep = predecessorNode.Successors.FirstOrDefault(s =>
                s.NodeId == request.NodeId
            );
            if (successorDep != null)
            {
                predecessorNode.Successors.Remove(successorDep);
            }
        }

        // Recalculate critical path
        CriticalPathCalculator.CalculateCriticalPath(wbs.Tree);

        // Increment version and save
        wbs.Version++;
        await _wbsRepository.UpdateAsync(wbs.Id, wbs, cancellationToken);

        return WBSMapper.MapToDto(wbs);
    }
}
