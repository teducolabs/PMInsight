using MediatR;
using Microsoft.Extensions.Logging;
using PMInsight.Application.Common.Interfaces;
using PMInsight.Application.Resources.Commands;
using PMInsight.Application.Resources.Dtos;
using PMInsight.Domain.Common;
using PMInsight.Domain.Entities;

namespace PMInsight.Application.Resources.Handlers;

/// <summary>
/// Handler for adding a resource assignment to a WBS node
/// </summary>
public class AddResourceAssignmentCommandHandler
    : IRequestHandler<AddResourceAssignmentCommand, ResourceAssignmentDto>
{
    private readonly IRepository<Domain.Entities.WBS> _wbsRepository;
    private readonly IRepository<Domain.Entities.User> _userRepository;
    private readonly ILogger<AddResourceAssignmentCommandHandler> _logger;

    public AddResourceAssignmentCommandHandler(
        IRepository<Domain.Entities.WBS> wbsRepository,
        IRepository<Domain.Entities.User> userRepository,
        ILogger<AddResourceAssignmentCommandHandler> logger
    )
    {
        _wbsRepository = wbsRepository;
        _userRepository = userRepository;
        _logger = logger;
    }

    public async Task<ResourceAssignmentDto> Handle(
        AddResourceAssignmentCommand command,
        CancellationToken cancellationToken
    )
    {
        var wbs = await _wbsRepository.GetByIdAsync(command.WbsId, cancellationToken);
        if (wbs == null)
            throw new KeyNotFoundException($"WBS with ID {command.WbsId} not found");

        var node = FindNodeInTree(wbs.Tree, command.NodeId);
        if (node == null)
            throw new KeyNotFoundException($"WBS Node with ID {command.NodeId} not found");

        // Verify user exists
        var user = await _userRepository.GetByIdAsync(command.Request.UserId, cancellationToken);
        if (user == null)
            throw new KeyNotFoundException($"User with ID {command.Request.UserId} not found");

        // Create new resource assignment
        var assignment = new ResourceAssignment
        {
            UserId = command.Request.UserId,
            AllocationPercent = command.Request.AllocationPercent,
            AssignmentStartDate = command.Request.AssignmentStartDate,
            AssignmentEndDate = command.Request.AssignmentEndDate,
            EstimatedHours = command.Request.EstimatedHours ?? 0,
            Role = command.Request.Role,
            IsPrimary = command.Request.IsPrimary,
            Notes = command.Request.Notes,
            Currency = node.Currency,
        };

        // If this is primary, unset other primary assignments
        if (assignment.IsPrimary)
        {
            foreach (var existing in node.ResourceAssignments)
            {
                existing.IsPrimary = false;
            }
        }

        // Add assignment to node
        node.ResourceAssignments.Add(assignment);

        // Update legacy AssignedUserIds for backward compatibility
        if (!node.AssignedUserIds.Contains(command.Request.UserId))
        {
            node.AssignedUserIds.Add(command.Request.UserId);
        }

        // Recalculate rollup values
        RecalculateNodeResourceRollup(node);

        // Save WBS
        await _wbsRepository.UpdateAsync(command.NodeId, wbs, cancellationToken);

        _logger.LogInformation(
            "Added resource assignment {AssignmentId} for user {UserId} to node {NodeId}",
            assignment.Id,
            assignment.UserId,
            command.NodeId
        );

        // Map to DTO
        return new ResourceAssignmentDto
        {
            Id = assignment.Id,
            UserId = assignment.UserId,
            UserName = user.Name,
            UserEmail = user.Email,
            AllocationPercent = assignment.AllocationPercent,
            AssignmentStartDate = assignment.AssignmentStartDate,
            AssignmentEndDate = assignment.AssignmentEndDate,
            EstimatedHours = assignment.EstimatedHours,
            ActualHours = assignment.ActualHours,
            PlannedCost = assignment.PlannedCost,
            ActualCost = assignment.ActualCost,
            Currency = assignment.Currency,
            Role = assignment.Role,
            IsPrimary = assignment.IsPrimary,
            Notes = assignment.Notes,
            CreatedAt = assignment.CreatedAt,
            UpdatedAt = assignment.UpdatedAt,
        };
    }

    private WBSNode? FindNodeInTree(List<WBSNode> nodes, string nodeId)
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

    private void RecalculateNodeResourceRollup(WBSNode node)
    {
        // Sum estimated hours from all assignments
        node.EstimatedHours = node.ResourceAssignments.Sum(a => a.EstimatedHours);

        // Sum actual hours from all assignments
        node.ActualHours = node.ResourceAssignments.Sum(a => a.ActualHours);

        // Sum planned cost from all assignments
        node.PlannedCost = node.ResourceAssignments.Sum(a => a.PlannedCost ?? 0);

        // Sum actual cost from all assignments
        node.ActualCost = node.ResourceAssignments.Sum(a => a.ActualCost ?? 0);
    }
}
