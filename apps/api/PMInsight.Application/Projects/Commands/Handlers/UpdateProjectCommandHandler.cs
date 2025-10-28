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

        // Update fields (only update non-null values)
        if (request.Code != null)
            project.Code = request.Code;
        
        if (request.Name != null)
            project.Name = request.Name;
        
        if (request.Description != null)
            project.Description = request.Description;
        
        if (request.Status.HasValue)
            project.Status = request.Status.Value;
        
        if (request.Priority != null)
            project.Priority = request.Priority;
        
        if (request.StartDate.HasValue)
            project.StartDate = request.StartDate.Value;
        
        if (request.EndDate.HasValue)
            project.EndDate = request.EndDate.Value;
        
        if (request.ActualStartDate.HasValue)
            project.ActualStartDate = request.ActualStartDate.Value;
        
        if (request.ActualEndDate.HasValue)
            project.ActualEndDate = request.ActualEndDate.Value;
        
        if (request.Budget.HasValue)
            project.Budget = request.Budget.Value;
        
        if (request.Currency != null)
            project.Currency = request.Currency;
        
        if (request.Progress.HasValue)
            project.Progress = request.Progress.Value;
        
        if (request.Health != null)
            project.Health = request.Health;
        
        if (request.ProjectManagerId != null)
            project.OwnerId = request.ProjectManagerId; // OwnerId is ProjectManager
        
        if (request.SponsorId != null)
            project.SponsorId = request.SponsorId;

        await _projectRepository.UpdateAsync(project.Id, project, cancellationToken);

        // Get manager/sponsor info
        var manager = await _userRepository.GetByIdAsync(project.OwnerId, cancellationToken);
        User? sponsor = null;
        if (project.SponsorId != null)
        {
            sponsor = await _userRepository.GetByIdAsync(project.SponsorId, cancellationToken);
        }

        return new ProjectDto
        {
            Id = project.Id,
            OrganizationId = project.OrganizationId,
            Code = project.Code,
            Name = project.Name,
            Description = project.Description,
            Status = project.Status.ToString(),
            Priority = project.Priority,
            StartDate = project.StartDate,
            EndDate = project.EndDate,
            ActualStartDate = project.ActualStartDate,
            ActualEndDate = project.ActualEndDate,
            Budget = project.Budget,
            Currency = project.Currency,
            Progress = project.Progress,
            Health = project.Health,
            ProjectManagerId = project.OwnerId,
            ProjectManagerName = manager?.Name,
            SponsorId = project.SponsorId,
            SponsorName = sponsor?.Name,
            TemplateId = project.TemplateId,
            CreatedAt = project.CreatedAt,
            UpdatedAt = project.UpdatedAt
        };
    }
}
