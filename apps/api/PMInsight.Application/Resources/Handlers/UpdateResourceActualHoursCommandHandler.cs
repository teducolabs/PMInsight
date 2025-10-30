using MediatR;
using Microsoft.Extensions.Logging;
using PMInsight.Application.Common.Interfaces;
using PMInsight.Application.Resources.Commands;
using PMInsight.Application.Resources.Dtos;
using PMInsight.Domain.Common;

namespace PMInsight.Application.Resources.Handlers;

/// <summary>
/// Handler for updating actual hours on a resource assignment
/// Now uses ProjectResource from the resource pool
/// </summary>
public class UpdateResourceActualHoursCommandHandler
    : IRequestHandler<UpdateResourceActualHoursCommand, ResourceAssignmentDto>
{
    private readonly IRepository<Domain.Entities.WBS> _wbsRepository;
    private readonly IRepository<Domain.Entities.ProjectResource> _projectResourceRepository;
    private readonly IRepository<Domain.Entities.User> _userRepository;
    private readonly ILogger<UpdateResourceActualHoursCommandHandler> _logger;

    public UpdateResourceActualHoursCommandHandler(
        IRepository<Domain.Entities.WBS> wbsRepository,
        IRepository<Domain.Entities.ProjectResource> projectResourceRepository,
        IRepository<Domain.Entities.User> userRepository,
        ILogger<UpdateResourceActualHoursCommandHandler> logger
    )
    {
        _wbsRepository = wbsRepository;
        _projectResourceRepository = projectResourceRepository;
        _userRepository = userRepository;
        _logger = logger;
    }

    public async Task<ResourceAssignmentDto> Handle(
        UpdateResourceActualHoursCommand command,
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

        // Update actual hours
        assignment.ActualHours = command.ActualHours;
        assignment.UpdatedAt = DateTime.UtcNow;

        // Recalculate cost if we have hourly rate (would need to get from user profile)
        // For now, just recalculate rollup
        RecalculateNodeResourceRollup(node);

        // Save WBS
        await _wbsRepository.UpdateAsync(command.WbsId, wbs, cancellationToken);

        _logger.LogInformation(
            "Updated actual hours to {ActualHours} for assignment {AssignmentId} on node {NodeId}",
            command.ActualHours,
            command.AssignmentId,
            command.NodeId
        );

        // Get ProjectResource info for DTO
        Domain.Entities.ProjectResource? projectResource = null;
        Domain.Entities.User? user = null;
        
        if (!string.IsNullOrEmpty(assignment.ProjectResourceId))
        {
            projectResource = await _projectResourceRepository.GetByIdAsync(
                assignment.ProjectResourceId,
                cancellationToken
            );
            
            if (projectResource != null && !string.IsNullOrEmpty(projectResource.UserId))
            {
                user = await _userRepository.GetByIdAsync(projectResource.UserId, cancellationToken);
            }
        }

        return new ResourceAssignmentDto
        {
            Id = assignment.Id,
            ProjectResourceId = assignment.ProjectResourceId,
            ResourceName = projectResource?.ResourceName ?? assignment.ResourceName,
            UserId = projectResource?.UserId ?? assignment.UserId,
            UserName = user?.Name,
            UserEmail = user?.Email,
            Role = projectResource?.Role ?? assignment.Role,
            HourlyRate = projectResource?.HourlyRate,
            AllocationPercent = assignment.AllocationPercent,
            AssignmentStartDate = assignment.AssignmentStartDate,
            AssignmentEndDate = assignment.AssignmentEndDate,
            EstimatedHours = assignment.EstimatedHours,
            ActualHours = assignment.ActualHours,
            PlannedCost = assignment.PlannedCost,
            ActualCost = assignment.ActualCost,
            Currency = assignment.Currency,
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
