using MediatR;
using PMInsight.Application.Common.Exceptions;
using PMInsight.Application.Common.Interfaces;
using PMInsight.Application.Projects.Dtos;
using PMInsight.Domain.Common;
using PMInsight.Domain.Entities;

namespace PMInsight.Application.Projects.Queries.Handlers;

public class GetProjectByIdQueryHandler : IRequestHandler<GetProjectByIdQuery, ProjectDto>
{
    private readonly IRepository<Project> _projectRepository;
    private readonly IRepository<User> _userRepository;
    private readonly ICurrentUserService _currentUserService;

    public GetProjectByIdQueryHandler(
        IRepository<Project> projectRepository,
        IRepository<User> userRepository,
        ICurrentUserService currentUserService)
    {
        _projectRepository = projectRepository;
        _userRepository = userRepository;
        _currentUserService = currentUserService;
    }

    public async Task<ProjectDto> Handle(GetProjectByIdQuery request, CancellationToken cancellationToken)
    {
        var project = await _projectRepository.GetByIdAsync(request.Id, cancellationToken);
        
        if (project == null)
        {
            throw new NotFoundException($"Project {request.Id} not found");
        }

        if (project.OrganizationId != _currentUserService.OrganizationId)
        {
            throw new UnauthorizedAccessException("You don't have permission to access this project");
        }

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
