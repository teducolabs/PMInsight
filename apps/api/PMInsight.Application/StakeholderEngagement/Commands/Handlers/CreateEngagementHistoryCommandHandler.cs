using MediatR;
using PMInsight.Application.Common.Exceptions;
using PMInsight.Application.Common.Interfaces;
using PMInsight.Application.StakeholderEngagement.Dtos;
using PMInsight.Domain.Common;
using PMInsight.Domain.Entities;

namespace PMInsight.Application.StakeholderEngagement.Commands.Handlers;

public class CreateEngagementHistoryCommandHandler : IRequestHandler<CreateEngagementHistoryCommand, StakeholderEngagementHistoryDto>
{
    private readonly IRepository<StakeholderEngagementHistory> _historyRepository;
    private readonly IRepository<Stakeholder> _stakeholderRepository;
    private readonly ICurrentUserService _currentUserService;

    public CreateEngagementHistoryCommandHandler(
        IRepository<StakeholderEngagementHistory> historyRepository,
        IRepository<Stakeholder> stakeholderRepository,
        ICurrentUserService currentUserService)
    {
        _historyRepository = historyRepository;
        _stakeholderRepository = stakeholderRepository;
        _currentUserService = currentUserService;
    }

    public async Task<StakeholderEngagementHistoryDto> Handle(CreateEngagementHistoryCommand request, CancellationToken cancellationToken)
    {
        var stakeholder = await _stakeholderRepository.GetByIdAsync(request.StakeholderId, cancellationToken);
        if (stakeholder == null)
        {
            throw new NotFoundException($"Stakeholder {request.StakeholderId} not found");
        }

        if (stakeholder.OrganizationId != _currentUserService.OrganizationId)
        {
            throw new UnauthorizedAccessException("You don't have permission to create engagement history for this stakeholder");
        }

        var history = new StakeholderEngagementHistory
        {
            OrganizationId = _currentUserService.OrganizationId,
            StakeholderId = request.StakeholderId,
            ActionId = request.ActionId,
            Type = request.Type,
            Title = request.Title,
            Description = request.Description,
            Outcome = request.Outcome,
            Feedback = request.Feedback,
            Sentiment = request.Sentiment,
            PerformedBy = _currentUserService.UserId ?? "System",
            PerformedAt = request.PerformedAt,
            NextAction = request.NextAction,
        };

        await _historyRepository.CreateAsync(history, cancellationToken);

        return new StakeholderEngagementHistoryDto
        {
            Id = history.Id,
            StakeholderId = history.StakeholderId,
            ActionId = history.ActionId,
            Type = history.Type,
            Title = history.Title,
            Description = history.Description,
            Outcome = history.Outcome,
            Feedback = history.Feedback,
            Sentiment = history.Sentiment,
            PerformedBy = history.PerformedBy,
            PerformedAt = history.PerformedAt,
            NextAction = history.NextAction,
            CreatedAt = history.CreatedAt,
        };
    }
}
