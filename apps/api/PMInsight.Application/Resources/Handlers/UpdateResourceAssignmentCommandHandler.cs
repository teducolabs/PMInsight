using MediatR;
using Microsoft.Extensions.Logging;
using PMInsight.Application.Common.Interfaces;
using PMInsight.Application.Resources.Commands;
using PMInsight.Application.Resources.Dtos;
using PMInsight.Domain.Common;

namespace PMInsight.Application.Resources.Handlers;

/// <summary>
/// Handler for updating a resource assignment
/// Now uses ProjectResource from the resource pool
/// </summary>
public class UpdateResourceAssignmentCommandHandler
    : IRequestHandler<UpdateResourceAssignmentCommand, ResourceAssignmentDto>
{
    private readonly IRepository<Domain.Entities.WBS> _wbsRepository;
    private readonly ITenantRepository<Domain.Entities.ProjectResource> _projectResourceRepository;
    private readonly IRepository<Domain.Entities.User> _userRepository;
    private readonly ILogger<UpdateResourceAssignmentCommandHandler> _logger;

    public UpdateResourceAssignmentCommandHandler(
        IRepository<Domain.Entities.WBS> wbsRepository,
        ITenantRepository<Domain.Entities.ProjectResource> projectResourceRepository,
        IRepository<Domain.Entities.User> userRepository,
        ILogger<UpdateResourceAssignmentCommandHandler> logger
    )
    {
        _wbsRepository = wbsRepository;
        _projectResourceRepository = projectResourceRepository;
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

        Domain.Entities.ProjectResource? projectResource = null;
        Domain.Entities.User? user = null;

        // Update ProjectResource reference if provided
        if (command.Request.ProjectResourceId != null)
        {
            projectResource = await _projectResourceRepository.GetByIdAsync(
                command.Request.ProjectResourceId,
                cancellationToken
            );
            if (projectResource == null)
                throw new KeyNotFoundException(
                    $"ProjectResource with ID {command.Request.ProjectResourceId} not found"
                );

            // Validate ProjectResource belongs to the same project
            if (projectResource.ProjectId != wbs.ProjectId)
                throw new InvalidOperationException(
                    "ProjectResource does not belong to this project"
                );

            // Validate ProjectResource is active
            if (!projectResource.IsActive)
                throw new InvalidOperationException("ProjectResource is not active");

            // Update assignment with new resource
            assignment.ProjectResourceId = projectResource.Id;
            assignment.UserId = projectResource.UserId; // Update for backward compatibility
            assignment.ResourceName = projectResource.ResourceName; // Update for backward compatibility
            assignment.Role = projectResource.Role;

            // Get user info if resource is linked to a user
            if (!string.IsNullOrEmpty(projectResource.UserId))
            {
                user = await _userRepository.GetByIdAsync(projectResource.UserId, cancellationToken);
            }
        }
        else if (!string.IsNullOrEmpty(assignment.ProjectResourceId))
        {
            // Get existing ProjectResource for DTO
            projectResource = await _projectResourceRepository.GetByIdAsync(
                assignment.ProjectResourceId,
                cancellationToken
            );
            
            if (projectResource != null && !string.IsNullOrEmpty(projectResource.UserId))
            {
                user = await _userRepository.GetByIdAsync(projectResource.UserId, cancellationToken);
            }
        }

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
            "Updated resource assignment {AssignmentId} (ProjectResourceId: {ProjectResourceId}, ResourceName: {ResourceName}) on node {NodeId}",
            assignment.Id,
            assignment.ProjectResourceId,
            assignment.ResourceName,
            command.NodeId
        );

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
