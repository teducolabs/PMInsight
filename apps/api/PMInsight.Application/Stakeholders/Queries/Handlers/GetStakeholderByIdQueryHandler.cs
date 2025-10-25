using MediatR;
using PMInsight.Application.Common.Exceptions;
using PMInsight.Application.Common.Interfaces;
using PMInsight.Application.Stakeholders.Dtos;
using PMInsight.Domain.Common;
using PMInsight.Domain.Entities;

namespace PMInsight.Application.Stakeholders.Queries.Handlers;

public class GetStakeholderByIdQueryHandler : IRequestHandler<GetStakeholderByIdQuery, StakeholderDto?>
{
    private readonly IRepository<Stakeholder> _stakeholderRepository;
    private readonly ICurrentUserService _currentUserService;

    public GetStakeholderByIdQueryHandler(
        IRepository<Stakeholder> stakeholderRepository,
        ICurrentUserService currentUserService)
    {
        _stakeholderRepository = stakeholderRepository;
        _currentUserService = currentUserService;
    }

    public async Task<StakeholderDto?> Handle(GetStakeholderByIdQuery request, CancellationToken cancellationToken)
    {
        var stakeholder = await _stakeholderRepository.GetByIdAsync(request.Id, cancellationToken);
        if (stakeholder == null)
        {
            return null;
        }

        if (stakeholder.OrganizationId != _currentUserService.OrganizationId)
        {
            throw new UnauthorizedAccessException("You don't have permission to view this stakeholder");
        }

        return new StakeholderDto
        {
            Id = stakeholder.Id,
            ProjectId = stakeholder.ProjectId,
            Name = stakeholder.Name,
            Role = stakeholder.Role,
            Influence = stakeholder.Influence.ToString(),
            Interest = stakeholder.Interest.ToString(),
            EngagementPlan = stakeholder.EngagementPlan,
            Contacts = stakeholder.Contacts.Select(c => new ContactDto
            {
                Type = c.Type.ToString(),
                Value = c.Value
            }),
            CreatedAt = stakeholder.CreatedAt,
            UpdatedAt = stakeholder.UpdatedAt
        };
    }
}