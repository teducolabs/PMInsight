using MediatR;
using PMInsight.Application.Common.Interfaces;
using PMInsight.Application.StakeholderEngagement.Dtos;
using PMInsight.Domain.Common;
using PMInsight.Domain.Entities;

namespace PMInsight.Application.StakeholderEngagement.Queries.Handlers;

public class GetStakeholderEngagementActionsQueryHandler : IRequestHandler<GetStakeholderEngagementActionsQuery, IEnumerable<StakeholderEngagementActionDto>>
{
    private readonly IRepository<StakeholderEngagementAction> _actionRepository;
    private readonly ICurrentUserService _currentUserService;

    public GetStakeholderEngagementActionsQueryHandler(
        IRepository<StakeholderEngagementAction> actionRepository,
        ICurrentUserService currentUserService)
    {
        _actionRepository = actionRepository;
        _currentUserService = currentUserService;
    }

    public async Task<IEnumerable<StakeholderEngagementActionDto>> Handle(GetStakeholderEngagementActionsQuery request, CancellationToken cancellationToken)
    {
        var actions = await _actionRepository.FindAsync(
            a => a.StakeholderId == request.StakeholderId && a.OrganizationId == _currentUserService.OrganizationId,
            cancellationToken);

        return actions
            .OrderBy(a => a.Priority)
            .ThenBy(a => a.CreatedAt)
            .Select(a => new StakeholderEngagementActionDto
            {
                Id = a.Id,
                StakeholderId = a.StakeholderId,
                Title = a.Title,
                Description = a.Description,
                Quadrant = a.Quadrant,
                Priority = a.Priority,
                Status = a.Status,
                DueDate = a.DueDate,
                CompletedDate = a.CompletedDate,
                AssignedTo = a.AssignedTo,
                Notes = a.Notes,
                CreatedAt = a.CreatedAt,
                UpdatedAt = a.UpdatedAt,
            })
            .ToList();
    }
}
