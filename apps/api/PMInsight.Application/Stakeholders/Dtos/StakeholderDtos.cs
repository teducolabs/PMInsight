using PMInsight.Domain.Enums;

namespace PMInsight.Application.Stakeholders.Dtos;

public record StakeholderDto
{
    public required string Id { get; init; }
    public required string ProjectId { get; init; }
    public required string Name { get; init; }
    public required string Role { get; init; }
    public string? Email { get; init; }
    public string? Phone { get; init; }
    public required StakeholderType Type { get; init; }
    public required InfluenceLevel Influence { get; init; }
    public required InterestLevel Interest { get; init; }
    public string? CommunicationPreference { get; init; }
    public string? Notes { get; init; }
    public required DateTime CreatedAt { get; init; }
    public required DateTime UpdatedAt { get; init; }
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