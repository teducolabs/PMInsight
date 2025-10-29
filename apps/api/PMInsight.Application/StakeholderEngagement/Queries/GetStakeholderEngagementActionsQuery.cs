using MediatR;
using PMInsight.Application.StakeholderEngagement.Dtos;

namespace PMInsight.Application.StakeholderEngagement.Queries;

public record GetStakeholderEngagementActionsQuery : IRequest<IEnumerable<StakeholderEngagementActionDto>>
{
    public required string StakeholderId { get; init; }
}
