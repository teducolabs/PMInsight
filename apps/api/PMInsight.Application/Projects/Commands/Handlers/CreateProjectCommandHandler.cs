using MediatR;
using PMInsight.Application.Common.Interfaces;
using PMInsight.Application.Projects.Dtos;
using PMInsight.Domain.Common;
using PMInsight.Domain.Entities;
using PMInsight.Domain.Enums;

namespace PMInsight.Application.Projects.Commands.Handlers;

public class CreateProjectCommandHandler : IRequestHandler<CreateProjectCommand, ProjectDto>
{
    private readonly IRepository<Project> _projectRepository;
    private readonly IRepository<User> _userRepository;
    private readonly ICurrentUserService _currentUserService;

    public CreateProjectCommandHandler(
        IRepository<Project> projectRepository,
        IRepository<User> userRepository,
        ICurrentUserService currentUserService)
    {
        _projectRepository = projectRepository;
        _userRepository = userRepository;
        _currentUserService = currentUserService;
    }

    public async Task<ProjectDto> Handle(CreateProjectCommand request, CancellationToken cancellationToken)
    {
        // Get project manager
        var projectManager = await _userRepository.GetByIdAsync(request.ProjectManagerId, cancellationToken);
        if (projectManager == null)
        {
            throw new ArgumentException($"Project manager with ID {request.ProjectManagerId} not found");
        }

        // Create project entity
        var project = new Project
        {
            OrganizationId = _currentUserService.OrganizationId ?? throw new InvalidOperationException("Organization ID is required"),
            Code = request.Code,
            Name = request.Name,
            Description = request.Description,
            OwnerId = request.ProjectManagerId,
            Status = request.Status,
            Priority = request.Priority,
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            Budget = request.Budget,
            Currency = request.Currency,
            SponsorId = request.SponsorId,
            TemplateId = request.TemplateId,
            Progress = 0,
            Health = "Green",
        };

        await _projectRepository.CreateAsync(project, cancellationToken);

        // Return DTO
        return new ProjectDto
        {
            Id = project.Id,
            Code = project.Code,
            Name = project.Name,
            Description = project.Description ?? string.Empty,
            Status = project.Status.ToString(),
            StartDate = project.StartDate ?? DateTime.UtcNow,
            EndDate = project.EndDate ?? DateTime.UtcNow.AddDays(90),
            Budget = project.Budget,
            OwnerId = project.OwnerId,
            OwnerName = projectManager.Name,
            CreatedAt = project.CreatedAt,
            UpdatedAt = project.UpdatedAt
        };
    }
}
