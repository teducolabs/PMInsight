using MediatR;
using Microsoft.Extensions.Logging;
using PMInsight.Application.Common.Interfaces;
using PMInsight.Application.Resources.Commands;
using PMInsight.Domain.Common;

namespace PMInsight.Application.Resources.Handlers;

/// <summary>
/// Handler for removing a resource assignment
/// </summary>
public class RemoveResourceAssignmentCommandHandler
    : IRequestHandler<RemoveResourceAssignmentCommand, Unit>
{
    private readonly IRepository<Domain.Entities.WBS> _wbsRepository;
    private readonly ILogger<RemoveResourceAssignmentCommandHandler> _logger;

    public RemoveResourceAssignmentCommandHandler(
        IRepository<Domain.Entities.WBS> wbsRepository,
        ILogger<RemoveResourceAssignmentCommandHandler> logger
    )
    {
        _wbsRepository = wbsRepository;
        _logger = logger;
    }

    public async Task<Unit> Handle(
        RemoveResourceAssignmentCommand command,
        CancellationToken cancellationToken
    )
    {
        var wbs = await _wbsRepository.GetByIdAsync(command.WbsId, cancellationToken);
        if (wbs == null)
            throw new KeyNotFoundException($"WBS with ID {command.WbsId} not found");

        var node = FindNodeInTree(wbs.Tree, command.NodeId);
        if (node == null)
            throw new KeyNotFoundException($"WBS Node with ID {command.NodeId} not found");

        var assignment = node.ResourceAssignments.FirstOrDefault(a => a.Id == command.AssignmentId);
        if (assignment == null)
            throw new KeyNotFoundException(
                $"Resource assignment with ID {command.AssignmentId} not found"
            );

        var userId = assignment.UserId;
        var resourceName = assignment.ResourceName;

        // Remove assignment
        node.ResourceAssignments.Remove(assignment);

        // Update legacy AssignedUserIds if no more assignments for this user (only if user was linked)
        if (!string.IsNullOrEmpty(userId) && !node.ResourceAssignments.Any(a => a.UserId == userId))
        {
            node.AssignedUserIds.Remove(userId);
        }

        // Recalculate rollup values
        RecalculateNodeResourceRollup(node);

        // Save WBS
        await _wbsRepository.UpdateAsync(command.NodeId, wbs, cancellationToken);

        _logger.LogInformation(
            "Removed resource assignment {AssignmentId} (ResourceName: {ResourceName}, UserId: {UserId}) from node {NodeId}",
            command.AssignmentId,
            resourceName,
            userId ?? "N/A",
            command.NodeId
        );

        return Unit.Value;
    }

    private Domain.Entities.WBSNode? FindNodeInTree(
        List<Domain.Entities.WBSNode> nodes,
        string nodeId
    )
    {
        foreach (var node in nodes)
        {
            if (node.Id == nodeId)
                return node;
            var found = FindNodeInTree(node.Children, nodeId);
            if (found != null)
                return found;
        }
        return null;
    }

    private void RecalculateNodeResourceRollup(Domain.Entities.WBSNode node)
    {
        node.EstimatedHours = node.ResourceAssignments.Sum(a => a.EstimatedHours);
        node.ActualHours = node.ResourceAssignments.Sum(a => a.ActualHours);
        node.PlannedCost = node.ResourceAssignments.Sum(a => a.PlannedCost ?? 0);
        node.ActualCost = node.ResourceAssignments.Sum(a => a.ActualCost ?? 0);
    }
}
