using MediatR;
using Microsoft.Extensions.Logging;
using PMInsight.Application.Common.Interfaces;
using PMInsight.Application.Resources.Commands;
using PMInsight.Application.Resources.Dtos;
using PMInsight.Domain.Common;

namespace PMInsight.Application.Resources.Handlers;

/// <summary>
/// Handler for updating a resource assignment
/// </summary>
public class UpdateResourceAssignmentCommandHandler
    : IRequestHandler<UpdateResourceAssignmentCommand, ResourceAssignmentDto>
{
    private readonly IRepository<Domain.Entities.WBS> _wbsRepository;
    private readonly IRepository<Domain.Entities.User> _userRepository;
    private readonly ILogger<UpdateResourceAssignmentCommandHandler> _logger;

    public UpdateResourceAssignmentCommandHandler(
        IRepository<Domain.Entities.WBS> wbsRepository,
        IRepository<Domain.Entities.User> userRepository,
        ILogger<UpdateResourceAssignmentCommandHandler> logger
    )
    {
        _wbsRepository = wbsRepository;
        _userRepository = userRepository;
        _logger = logger;
    }

    public async Task<ResourceAssignmentDto> Handle(
        UpdateResourceAssignmentCommand command,
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

        // Update assignment properties
        if (command.Request.AllocationPercent.HasValue)
            assignment.AllocationPercent = command.Request.AllocationPercent.Value;

        if (command.Request.AssignmentStartDate.HasValue)
            assignment.AssignmentStartDate = command.Request.AssignmentStartDate;

        if (command.Request.AssignmentEndDate.HasValue)
            assignment.AssignmentEndDate = command.Request.AssignmentEndDate;

        if (command.Request.EstimatedHours.HasValue)
            assignment.EstimatedHours = command.Request.EstimatedHours.Value;

        if (command.Request.ActualHours.HasValue)
            assignment.ActualHours = command.Request.ActualHours.Value;

        if (command.Request.Role != null)
            assignment.Role = command.Request.Role;

        if (command.Request.IsPrimary.HasValue)
        {
            assignment.IsPrimary = command.Request.IsPrimary.Value;

            // If setting as primary, unset others
            if (assignment.IsPrimary)
            {
                foreach (var other in node.ResourceAssignments.Where(a => a.Id != assignment.Id))
                {
                    other.IsPrimary = false;
                }
            }
        }

        if (command.Request.Notes != null)
            assignment.Notes = command.Request.Notes;

        assignment.UpdatedAt = DateTime.UtcNow;

        // Recalculate rollup values
        RecalculateNodeResourceRollup(node);

        // Save WBS
        await _wbsRepository.UpdateAsync(command.NodeId, wbs, cancellationToken);

        _logger.LogInformation(
            "Updated resource assignment {AssignmentId} for user {UserId} on node {NodeId}",
            assignment.Id,
            assignment.UserId,
            command.NodeId
        );

        // Get user info for DTO
        var user = await _userRepository.GetByIdAsync(assignment.UserId, cancellationToken);

        return new ResourceAssignmentDto
        {
            Id = assignment.Id,
            UserId = assignment.UserId,
            UserName = user?.Name,
            UserEmail = user?.Email,
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
