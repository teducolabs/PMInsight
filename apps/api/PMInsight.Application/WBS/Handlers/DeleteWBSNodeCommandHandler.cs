using MediatR;
using PMInsight.Application.Common.Interfaces;
using PMInsight.Application.WBS.Commands;
using PMInsight.Application.WBS.Helpers;
using PMInsight.Domain.Common;
using PMInsight.Domain.Entities;

namespace PMInsight.Application.WBS.Handlers;

public class DeleteWBSNodeCommandHandler : IRequestHandler<DeleteWBSNodeCommand, bool>
{
    private readonly IRepository<Domain.Entities.WBS> _wbsRepository;
    private readonly ICurrentUserService _currentUserService;

    public DeleteWBSNodeCommandHandler(
        IRepository<Domain.Entities.WBS> wbsRepository,
        ICurrentUserService currentUserService)
    {
        _wbsRepository = wbsRepository;
        _currentUserService = currentUserService;
    }

    public async Task<bool> Handle(DeleteWBSNodeCommand request, CancellationToken cancellationToken)
    {
        var wbs = await _wbsRepository.GetByIdAsync(request.WBSId, cancellationToken);
        
        if (wbs == null || wbs.OrganizationId != _currentUserService.OrganizationId)
        {
            return false;
        }

        // Check if locked by someone else
        if (!string.IsNullOrEmpty(wbs.LockedBy) && wbs.LockedBy != _currentUserService.UserId)
        {
            throw new InvalidOperationException("WBS is locked by another user");
        }

        // Find node before deletion to get its info
        var nodeToDelete = WBSMapper.FindNodeById(wbs.Tree, request.NodeId);
        if (nodeToDelete == null)
        {
            return false;
        }

        // Cleanup dependencies: Remove this node from all predecessors/successors lists
        RemoveDependenciesOnNode(wbs.Tree, request.NodeId);

        // Remove node from tree
        bool removed = WBSMapper.RemoveNodeFromTree(wbs.Tree, request.NodeId);
        
        if (!removed)
        {
            return false;
        }

        // Re-assign sequence IDs and WBS codes after deletion
        WBSMapper.AssignSequenceIds(wbs.Tree);

        // Increment version
        wbs.Version++;
        
        // Save
        await _wbsRepository.UpdateAsync(wbs.Id, wbs, cancellationToken);

        return true;
    }

    /// <summary>
    /// Remove all dependencies referencing the deleted node
    /// </summary>
    private void RemoveDependenciesOnNode(List<WBSNode> tree, string deletedNodeId)
    {
        void CleanupNode(WBSNode node)
        {
            // Remove from predecessors
            if (node.Predecessors?.Any() == true)
            {
                node.Predecessors = node.Predecessors
                    .Where(p => p.NodeId != deletedNodeId)
                    .ToList();
            }

            // Remove from successors
            if (node.Successors?.Any() == true)
            {
                node.Successors = node.Successors
                    .Where(s => s.NodeId != deletedNodeId)
                    .ToList();
            }

            // Recursively cleanup children
            foreach (var child in node.Children)
            {
                CleanupNode(child);
            }
        }

        foreach (var node in tree)
        {
            CleanupNode(node);
        }
    }
}
