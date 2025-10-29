using MediatR;
using PMInsight.Application.StakeholderEngagement.Dtos;

namespace PMInsight.Application.StakeholderEngagement.Queries;

public record GetStakeholderEngagementHistoryQuery : IRequest<IEnumerable<StakeholderEngagementHistoryDto>>
{
    public required string StakeholderId { get; init; }
}
