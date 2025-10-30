using MediatR;
using PMInsight.Application.Common.Interfaces;
using PMInsight.Application.ProjectResources.Dtos;
using PMInsight.Domain.Common;
using PMInsight.Domain.Entities;

namespace PMInsight.Application.ProjectResources.Queries;

/// <summary>
/// Query to get all resources in project pool with utilization stats
/// </summary>
public record GetProjectResourcesQuery : IRequest<List<ProjectResourceDto>>
{
    public required string ProjectId { get; init; }
}

/// <summary>
/// Handler for GetProjectResourcesQuery
/// Calculates utilization for each resource by aggregating all assignments
/// </summary>
public class GetProjectResourcesQueryHandler 
    : IRequestHandler<GetProjectResourcesQuery, List<ProjectResourceDto>>
{
    private readonly ITenantRepository<ProjectResource> _resourceRepository;
    private readonly ITenantRepository<WBS> _wbsRepository;

    public GetProjectResourcesQueryHandler(
        ITenantRepository<ProjectResource> resourceRepository,
        ITenantRepository<WBS> wbsRepository)
    {
        _resourceRepository = resourceRepository;
        _wbsRepository = wbsRepository;
    }

    public async Task<List<ProjectResourceDto>> Handle(
        GetProjectResourcesQuery query, 
        CancellationToken cancellationToken)
    {
        // Get all active resources for project
        var resources = await _resourceRepository.FindAsync(
            r => r.ProjectId == query.ProjectId && r.IsActive, 
            cancellationToken
        );

        // Get all WBS to calculate utilization
        var wbsList = await _wbsRepository.FindAsync(
            w => w.ProjectId == query.ProjectId, 
            cancellationToken
        );
        
        var allAssignments = wbsList
            .SelectMany(w => w.Tree)
            .SelectMany(n => n.ResourceAssignments)
            .ToList();

        // Map with utilization stats
        var dtos = resources.Select(resource =>
        {
            var assignments = allAssignments
                .Where(a => a.ProjectResourceId == resource.Id)
                .ToList();

            var totalHours = assignments.Sum(a => a.EstimatedHours);
            var utilization = resource.MonthlyCapacity.HasValue && resource.MonthlyCapacity > 0
                ? (totalHours / resource.MonthlyCapacity.Value) * 100
                : 0;

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
                AssignmentCount = assignments.Count,
                TotalAllocatedHours = totalHours,
                UtilizationPercent = Math.Round(utilization, 1)
            };
        })
        .OrderBy(r => r.ResourceName)
        .ToList();

        return dtos;
    }
}
