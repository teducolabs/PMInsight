using PMInsight.Domain.Enums;

namespace PMInsight.Application.Stakeholders.Dtos;

public record StakeholderDto
{
    public required string Id { get; init; }
    public required string ProjectId { get; init; }
    public required string Name { get; init; }
    public required string Role { get; init; }
    public required string Influence { get; init; }
    public required string Interest { get; init; }
    public required string EngagementPlan { get; init; }
    public required IEnumerable<ContactDto> Contacts { get; init; }
    public required DateTime CreatedAt { get; init; }
    public required DateTime UpdatedAt { get; init; }
}

public record ContactDto
{
    public required string Type { get; init; }
    public required string Value { get; init; }
}

public record StakeholderMatrixCell
{
    public InfluenceLevel Influence { get; init; }
    public InterestLevel Interest { get; init; }
    public required IEnumerable<StakeholderDto> Stakeholders { get; init; }
}

public record StakeholderMatrixDto
{
    public required IEnumerable<StakeholderMatrixCell> Grid { get; init; }
    public required int TotalCount { get; init; }
}