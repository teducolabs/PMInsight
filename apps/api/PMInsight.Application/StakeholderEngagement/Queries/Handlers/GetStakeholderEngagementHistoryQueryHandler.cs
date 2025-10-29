using MediatR;
using PMInsight.Application.Common.Interfaces;
using PMInsight.Application.StakeholderEngagement.Dtos;
using PMInsight.Domain.Common;
using PMInsight.Domain.Entities;

namespace PMInsight.Application.StakeholderEngagement.Queries.Handlers;

public class GetStakeholderEngagementHistoryQueryHandler : IRequestHandler<GetStakeholderEngagementHistoryQuery, IEnumerable<StakeholderEngagementHistoryDto>>
{
    private readonly IRepository<StakeholderEngagementHistory> _historyRepository;
    private readonly ICurrentUserService _currentUserService;

    public GetStakeholderEngagementHistoryQueryHandler(
        IRepository<StakeholderEngagementHistory> historyRepository,
        ICurrentUserService currentUserService)
    {
        _historyRepository = historyRepository;
        _currentUserService = currentUserService;
    }

    public async Task<IEnumerable<StakeholderEngagementHistoryDto>> Handle(GetStakeholderEngagementHistoryQuery request, CancellationToken cancellationToken)
    {
        var histories = await _historyRepository.FindAsync(
            h => h.StakeholderId == request.StakeholderId && h.OrganizationId == _currentUserService.OrganizationId,
            cancellationToken);

        return histories
            .OrderByDescending(h => h.PerformedAt)
            .Select(h => new StakeholderEngagementHistoryDto
            {
                Id = h.Id,
                StakeholderId = h.StakeholderId,
                ActionId = h.ActionId,
                Type = h.Type,
                Title = h.Title,
                Description = h.Description,
                Outcome = h.Outcome,
                Feedback = h.Feedback,
                Sentiment = h.Sentiment,
                PerformedBy = h.PerformedBy,
                PerformedAt = h.PerformedAt,
                NextAction = h.NextAction,
                CreatedAt = h.CreatedAt,
            })
            .ToList();
    }
}
