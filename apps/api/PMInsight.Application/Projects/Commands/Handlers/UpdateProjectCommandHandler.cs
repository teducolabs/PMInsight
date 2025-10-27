using MediatR;
using PMInsight.Application.Common.Exceptions;
using PMInsight.Application.Common.Interfaces;
using PMInsight.Application.Projects.Dtos;
using PMInsight.Domain.Common;
using PMInsight.Domain.Entities;

namespace PMInsight.Application.Projects.Commands.Handlers;

public class UpdateProjectCommandHandler : IRequestHandler<UpdateProjectCommand, ProjectDto>
{
    private readonly IRepository<Project> _projectRepository;
    private readonly IRepository<User> _userRepository;
    private readonly ICurrentUserService _currentUserService;

    public UpdateProjectCommandHandler(
        IRepository<Project> projectRepository,
        IRepository<User> userRepository,
        ICurrentUserService currentUserService)
    {
        _projectRepository = projectRepository;
        _userRepository = userRepository;
        _currentUserService = currentUserService;
    }

    public async Task<ProjectDto> Handle(UpdateProjectCommand request, CancellationToken cancellationToken)
    {
        var project = await _projectRepository.GetByIdAsync(request.Id, cancellationToken);
        
        if (project == null)
        {
            throw new NotFoundException($"Project {request.Id} not found");
        }

        if (project.OrganizationId != _currentUserService.OrganizationId)
        {
            throw new UnauthorizedAccessException("You don't have permission to update this project");
        }

        // Update fields
        project.Name = request.Name;
        project.Description = request.Description;
        project.StartDate = request.StartDate;
        project.EndDate = request.EndDate;
        project.Budget = request.Budget;

        await _projectRepository.UpdateAsync(project.Id, project, cancellationToken);

        // Get owner info
        var owner = await _userRepository.GetByIdAsync(project.OwnerId, cancellationToken);

        return new ProjectDto
        {
            Id = project.Id,
            Code = project.Code,
            Name = project.Name,
            Description = project.Description ?? string.Empty,
            Status = project.Status.ToString(),
            StartDate = project.StartDate ?? DateTime.UtcNow,
            EndDate = project.EndDate ?? DateTime.UtcNow,
            Budget = project.Budget,
            OwnerId = project.OwnerId,
            OwnerName = owner?.Name ?? "Unknown",
            CreatedAt = project.CreatedAt,
            UpdatedAt = project.UpdatedAt
        };
    }
}
