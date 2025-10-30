using MediatR;
using PMInsight.Application.Common.Interfaces;
using PMInsight.Application.ProjectResources.Dtos;
using PMInsight.Domain.Common;
using PMInsight.Domain.Entities;

namespace PMInsight.Application.ProjectResources.Commands;

/// <summary>
/// Command to create a new resource in project pool
/// </summary>
public record CreateProjectResourceCommand : IRequest<ProjectResourceDto>
{
    public required string ProjectId { get; init; }
    public required CreateProjectResourceRequest Request { get; init; }
}

/// <summary>
/// Handler for CreateProjectResourceCommand
/// Validates uniqueness and user existence before creating
/// </summary>
public class CreateProjectResourceCommandHandler 
    : IRequestHandler<CreateProjectResourceCommand, ProjectResourceDto>
{
    private readonly IRepository<ProjectResource> _resourceRepository;
    private readonly IRepository<User> _userRepository;
    private readonly IRepository<Domain.Entities.WBS> _wbsRepository;
    private readonly ICurrentUserService _currentUserService;

    public CreateProjectResourceCommandHandler(
        IRepository<ProjectResource> resourceRepository,
        IRepository<User> userRepository,
        IRepository<Domain.Entities.WBS> wbsRepository,
        ICurrentUserService currentUserService)
    {
        _resourceRepository = resourceRepository;
        _userRepository = userRepository;
        _wbsRepository = wbsRepository;
        _currentUserService = currentUserService;
    }

    public async Task<ProjectResourceDto> Handle(
        CreateProjectResourceCommand command, 
        CancellationToken cancellationToken)
    {
        var orgId = _currentUserService.OrganizationId!;

        // Validate unique name within project
        var existing = await _resourceRepository.FindOneAsync(
            r => r.ProjectId == command.ProjectId 
                && r.ResourceName == command.Request.ResourceName 
                && r.IsActive,
            cancellationToken
        );

        if (existing != null)
        {
            throw new InvalidOperationException(
                $"Resource name '{command.Request.ResourceName}' already exists in this project."
            );
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

        // Create resource
        var resource = new ProjectResource
        {
            ProjectId = command.ProjectId,
            ResourceName = command.Request.ResourceName,
            UserId = command.Request.UserId,
            Role = command.Request.Role,
            HourlyRate = command.Request.HourlyRate,
            MonthlyCapacity = command.Request.MonthlyCapacity,
            OrganizationId = orgId,
            CreatedAt = DateTime.UtcNow,
        };

        var created = await _resourceRepository.CreateAsync(resource, cancellationToken);

        // Return DTO with zero utilization (newly created)
        return MapToDto(created, 0, 0m, 0m);
    }

    private static ProjectResourceDto MapToDto(
        ProjectResource resource, 
        int assignmentCount, 
        decimal totalHours, 
        decimal utilization)
    {
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
            AssignmentCount = assignmentCount,
            TotalAllocatedHours = totalHours,
            UtilizationPercent = utilization
        };
    }
}
