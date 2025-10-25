using MediatR;
using PMInsight.Application.Common.Models;
using PMInsight.Application.Stakeholders.Dtos;

namespace PMInsight.Application.Stakeholders.Queries;

public record GetProjectStakeholdersQuery : IRequest<PaginatedResponse<StakeholderDto>>
{
    public required string ProjectId { get; init; }
    public string? SearchText { get; init; }
    public int? MinInfluence { get; init; }
    public int? MinInterest { get; init; }
    public int PageNumber { get; init; } = 1;
    public int PageSize { get; init; } = 10;
}

public record GetStakeholderByIdQuery : IRequest<StakeholderDto?>
{
    public required string Id { get; init; }
}

public record GetStakeholderMatrixQuery : IRequest<StakeholderMatrixDto>
{
    public required string ProjectId { get; init; }
}