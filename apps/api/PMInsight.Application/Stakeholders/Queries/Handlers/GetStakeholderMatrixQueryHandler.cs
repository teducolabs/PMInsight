using MediatR;
using PMInsight.Application.Common.Exceptions;
using PMInsight.Application.Common.Interfaces;
using PMInsight.Application.Stakeholders.Dtos;
using PMInsight.Domain.Common;
using PMInsight.Domain.Entities;
using PMInsight.Domain.Enums;

namespace PMInsight.Application.Stakeholders.Queries.Handlers;

public class GetStakeholderMatrixQueryHandler : IRequestHandler<GetStakeholderMatrixQuery, StakeholderMatrixDto>
{
    private readonly IRepository<Stakeholder> _stakeholderRepository;
    private readonly IRepository<Project> _projectRepository;
    private readonly ICurrentUserService _currentUserService;

    public GetStakeholderMatrixQueryHandler(
        IRepository<Stakeholder> stakeholderRepository,
        IRepository<Project> projectRepository,
        ICurrentUserService currentUserService)
    {
        _stakeholderRepository = stakeholderRepository;
        _projectRepository = projectRepository;
        _currentUserService = currentUserService;
    }

    public async Task<StakeholderMatrixDto> Handle(GetStakeholderMatrixQuery request, CancellationToken cancellationToken)
    {
        // Verify project exists and user has access
        var project = await _projectRepository.GetByIdAsync(request.ProjectId, cancellationToken);
        if (project == null)
        {
            throw new NotFoundException($"Project {request.ProjectId} not found");
        }

        if (project.OrganizationId != _currentUserService.OrganizationId)
        {
            throw new UnauthorizedAccessException("You don't have permission to view this project's stakeholders");
        }

        var stakeholders = await _stakeholderRepository.FindAsync(
            s => s.ProjectId == request.ProjectId,
            cancellationToken);

        var grid = stakeholders
            .GroupBy(s => new { s.Influence, s.Interest })
            .Select(g => new StakeholderMatrixCell
            {
                Influence = g.Key.Influence,
                Interest = g.Key.Interest,
                Stakeholders = g.Select(s => new StakeholderDto
                {
                    Id = s.Id,
                    ProjectId = s.ProjectId,
                    Name = s.Name,
                    Role = s.Role,
                    Email = s.Email,
                    Phone = s.Phone,
                    Type = s.Type,
                    Influence = s.Influence,
                    Interest = s.Interest,
                    CommunicationPreference = s.CommunicationPreference,
                    Notes = s.Notes,
                    CreatedAt = s.CreatedAt,
                    UpdatedAt = s.UpdatedAt
                })
            })
            .OrderByDescending(c => c.Influence)
            .ThenByDescending(c => c.Interest)
            .ToList();

        return new StakeholderMatrixDto
        {
            Grid = grid,
            TotalCount = stakeholders.Count
        };
    }
}