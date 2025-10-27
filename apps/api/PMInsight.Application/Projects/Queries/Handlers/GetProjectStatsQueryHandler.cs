using MediatR;
using PMInsight.Application.Common.Interfaces;
using PMInsight.Domain.Common;
using PMInsight.Domain.Entities;
using PMInsight.Domain.Enums;

namespace PMInsight.Application.Projects.Queries.Handlers;

public class GetProjectStatsQueryHandler : IRequestHandler<GetProjectStatsQuery, ProjectStatsDto>
{
    private readonly IRepository<Project> _projectRepository;
    private readonly ICurrentUserService _currentUserService;

    public GetProjectStatsQueryHandler(
        IRepository<Project> projectRepository,
        ICurrentUserService currentUserService)
    {
        _projectRepository = projectRepository;
        _currentUserService = currentUserService;
    }

    public async Task<ProjectStatsDto> Handle(GetProjectStatsQuery request, CancellationToken cancellationToken)
    {
        // Get all projects for organization
        var allProjects = await _projectRepository.GetAllAsync(cancellationToken);
        var projects = allProjects
            .Where(p => p.OrganizationId == _currentUserService.OrganizationId)
            .ToList();

        // Calculate stats
        var totalProjects = projects.Count;
        var activeProjects = projects.Count(p => 
            p.Status == ProjectStatus.Executing || 
            p.Status == ProjectStatus.Planning ||
            p.Status == ProjectStatus.Monitoring);
        var completedProjects = projects.Count(p => p.Status == ProjectStatus.Closed);
        var onHoldProjects = projects.Count(p => p.Status == ProjectStatus.OnHold);
        
        // RAG status
        var redProjects = projects.Count(p => p.Health == "Red");
        var yellowProjects = projects.Count(p => p.Health == "Yellow");
        var greenProjects = projects.Count(p => p.Health == "Green");

        return new ProjectStatsDto
        {
            TotalProjects = totalProjects,
            ActiveProjects = activeProjects,
            CompletedProjects = completedProjects,
            OnHoldProjects = onHoldProjects,
            RedProjects = redProjects,
            YellowProjects = yellowProjects,
            GreenProjects = greenProjects
        };
    }
}
