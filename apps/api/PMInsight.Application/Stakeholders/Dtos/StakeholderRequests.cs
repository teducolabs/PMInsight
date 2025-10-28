namespace PMInsight.Application.Stakeholders.Dtos;

public record GetProjectStakeholdersRequest
{
    public required string ProjectId { get; init; }
    public int? MinInfluence { get; init; }
    public int? MinInterest { get; init; }
    public string? SearchText { get; init; }
    public int PageSize { get; init; } = 20;
    public int PageNumber { get; init; } = 1;
}

public record CreateStakeholderRequest
{
    public required string ProjectId { get; init; }
    public required string Name { get; init; }
    public required string Role { get; init; }
    public string? Email { get; init; }
    public string? Phone { get; init; }
    public required string Type { get; init; }
    public required int Influence { get; init; }
    public required int Interest { get; init; }
    public string? CommunicationPreference { get; init; }
    public string? Notes { get; init; }
}

public record UpdateStakeholderRequest
{
    public required string Id { get; init; }
    public string? Name { get; init; }
    public string? Role { get; init; }
    public string? Email { get; init; }
    public string? Phone { get; init; }
    public string? Type { get; init; }
    public int? Influence { get; init; }
    public int? Interest { get; init; }
    public string? CommunicationPreference { get; init; }
    public string? Notes { get; init; }
}
