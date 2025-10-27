using MediatR;
using PMInsight.Application.Common.Interfaces;
using PMInsight.Application.Projects.Dtos;
using PMInsight.Domain.Common;
using PMInsight.Domain.Entities;

namespace PMInsight.Application.Projects.Queries.Handlers;

public class GetProjectsQueryHandler : IRequestHandler<GetProjectsQuery, PaginatedResponse<ProjectDto>>
{
    private readonly IRepository<Project> _projectRepository;
    private readonly IRepository<User> _userRepository;
    private readonly ICurrentUserService _currentUserService;

    public GetProjectsQueryHandler(
        IRepository<Project> projectRepository,
        IRepository<User> userRepository,
        ICurrentUserService currentUserService)
    {
        _projectRepository = projectRepository;
        _userRepository = userRepository;
        _currentUserService = currentUserService;
    }

    public async Task<PaginatedResponse<ProjectDto>> Handle(GetProjectsQuery request, CancellationToken cancellationToken)
    {
        // For now, get all projects and filter in memory
        // TODO: Implement proper filtering at repository level
        var allProjects = await _projectRepository.GetAllAsync(cancellationToken);
        
        var filtered = allProjects
            .Where(p => p.OrganizationId == _currentUserService.OrganizationId);

        if (request.Status.HasValue)
        {
            filtered = filtered.Where(p => p.Status == request.Status.Value);
        }

        if (!string.IsNullOrEmpty(request.OwnerId))
        {
            filtered = filtered.Where(p => p.OwnerId == request.OwnerId);
        }

        if (!string.IsNullOrEmpty(request.SearchText))
        {
            var search = request.SearchText.ToLower();
            filtered = filtered.Where(p => 
                p.Name.ToLower().Contains(search) || 
                p.Code.ToLower().Contains(search));
        }

        if (request.FromDate.HasValue)
        {
            filtered = filtered.Where(p => p.StartDate >= request.FromDate.Value);
        }

        if (request.ToDate.HasValue)
        {
            filtered = filtered.Where(p => p.EndDate <= request.ToDate.Value);
        }

        var projectsList = filtered.ToList();

        // Get unique owner IDs
        var ownerIds = projectsList.Select(p => p.OwnerId).Distinct().ToList();
        var allUsers = await _userRepository.GetAllAsync(cancellationToken);
        var userDict = allUsers
            .Where(u => ownerIds.Contains(u.Id))
            .ToDictionary(u => u.Id, u => u.Name);

        // Map to DTOs
        var dtos = projectsList.Select(p => new ProjectDto
        {
            Id = p.Id,
            Code = p.Code,
            Name = p.Name,
            Description = p.Description ?? string.Empty,
            Status = p.Status.ToString(),
            StartDate = p.StartDate ?? DateTime.UtcNow,
            EndDate = p.EndDate ?? DateTime.UtcNow,
            Budget = p.Budget,
            OwnerId = p.OwnerId,
            OwnerName = userDict.GetValueOrDefault(p.OwnerId, "Unknown"),
            CreatedAt = p.CreatedAt,
            UpdatedAt = p.UpdatedAt
        }).ToList();

        return new PaginatedResponse<ProjectDto>
        {
            Items = dtos,
            NextCursor = null,
            Total = dtos.Count
        };
    }
}
