using MediatR;
using PMInsight.Application.Common.Interfaces;
using PMInsight.Application.ProjectResources.Dtos;
using PMInsight.Domain.Common;
using PMInsight.Domain.Entities;

namespace PMInsight.Application.ProjectResources.Commands;

/// <summary>
/// Command to update an existing resource in project pool
/// </summary>
public record UpdateProjectResourceCommand : IRequest<ProjectResourceDto>
{
    public required string ResourceId { get; init; }
    public required UpdateProjectResourceRequest Request { get; init; }
}

/// <summary>
/// Handler for UpdateProjectResourceCommand
/// Updates resource and recalculates utilization stats
/// </summary>
public class UpdateProjectResourceCommandHandler 
    : IRequestHandler<UpdateProjectResourceCommand, ProjectResourceDto>
{
    private readonly ITenantRepository<ProjectResource> _resourceRepository;
    private readonly ITenantRepository<User> _userRepository;
    private readonly ITenantRepository<WBS> _wbsRepository;
    private readonly ICurrentUserService _currentUserService;

    public UpdateProjectResourceCommandHandler(
        ITenantRepository<ProjectResource> resourceRepository,
        ITenantRepository<User> userRepository,
        ITenantRepository<WBS> wbsRepository,
        ICurrentUserService currentUserService)
    {
        _resourceRepository = resourceRepository;
        _userRepository = userRepository;
        _wbsRepository = wbsRepository;
        _currentUserService = currentUserService;
    }

    public async Task<ProjectResourceDto> Handle(
        UpdateProjectResourceCommand command, 
        CancellationToken cancellationToken)
    {
        var resource = await _resourceRepository.GetByIdAsync(
            command.ResourceId, 
            cancellationToken
        );

        if (resource == null)
        {
            throw new KeyNotFoundException(
                $"Project resource with ID '{command.ResourceId}' not found."
            );
        }

        // Validate unique name if changed
        if (resource.ResourceName != command.Request.ResourceName)
        {
            var existing = await _resourceRepository.FindOneAsync(
                r => r.ProjectId == resource.ProjectId 
                    && r.ResourceName == command.Request.ResourceName 
                    && r.Id != command.ResourceId
                    && r.IsActive,
                cancellationToken
            );

            if (existing != null)
            {
                throw new InvalidOperationException(
                    $"Resource name '{command.Request.ResourceName}' already exists in this project."
                );
            }
        }

        // Validate user if provided
        if (!string.IsNullOrEmpty(command.Request.UserId))
        {
            var user = await _userRepository.GetByIdAsync(
                command.Request.UserId, 
                cancellationToken
            );
            
            if (user == null)
            {
                throw new KeyNotFoundException(
                    $"User with ID '{command.Request.UserId}' not found."
                );
            }
        }

        // Update resource
        resource.ResourceName = command.Request.ResourceName;
        resource.UserId = command.Request.UserId;
        resource.Role = command.Request.Role;
        resource.HourlyRate = command.Request.HourlyRate;
        resource.MonthlyCapacity = command.Request.MonthlyCapacity;
        resource.UpdatedAt = DateTime.UtcNow;
        resource.UpdatedBy = _currentUserService.UserId;

        await _resourceRepository.UpdateAsync(command.ResourceId, resource, cancellationToken);

        // Calculate utilization
        var utilization = await CalculateUtilizationAsync(
            resource.Id, 
            resource.ProjectId, 
            resource.MonthlyCapacity,
            cancellationToken
        );

        return new ProjectResourceDto
        {
            Id = resource.Id,
            ProjectId = resource.ProjectId,
            ResourceName = resource.ResourceName,
            UserId = resource.UserId,
            Role = resource.Role,
            HourlyRate = resource.HourlyRate,
            MonthlyCapacity = resource.MonthlyCapacity,
            IsActive = resource.IsActive,
            AssignmentCount = utilization.Count,
            TotalAllocatedHours = utilization.TotalHours,
            UtilizationPercent = utilization.Percent
        };
    }

    private async Task<(int Count, decimal TotalHours, decimal Percent)> CalculateUtilizationAsync(
        string resourceId, 
        string projectId, 
        decimal? monthlyCapacity,
        CancellationToken cancellationToken)
    {
        var wbsList = await _wbsRepository.FindAsync(
            w => w.ProjectId == projectId, 
            cancellationToken
        );

        var assignments = wbsList
            .SelectMany(w => w.Tree)
            .SelectMany(n => n.ResourceAssignments)
            .Where(a => a.ProjectResourceId == resourceId)
            .ToList();

        var totalHours = assignments.Sum(a => a.EstimatedHours);
        var percent = monthlyCapacity.HasValue && monthlyCapacity > 0
            ? (totalHours / monthlyCapacity.Value) * 100
            : 0;

        return (assignments.Count, totalHours, Math.Round(percent, 1));
    }
}
