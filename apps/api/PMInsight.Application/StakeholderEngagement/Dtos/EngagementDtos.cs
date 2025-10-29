using PMInsight.Domain.Enums;

namespace PMInsight.Application.StakeholderEngagement.Dtos;

public record StakeholderEngagementHistoryDto
{
    public required string Id { get; init; }
    public required string StakeholderId { get; init; }
    public string? ActionId { get; init; }
    public required string Type { get; init; }
    public required string Title { get; init; }
    public required string Description { get; init; }
    public string? Outcome { get; init; }
    public string? Feedback { get; init; }
    public string? Sentiment { get; init; }
    public required string PerformedBy { get; init; }
    public required DateTime PerformedAt { get; init; }
    public string? NextAction { get; init; }
    public required DateTime CreatedAt { get; init; }
}

public record StakeholderEngagementActionDto
{
    public required string Id { get; init; }
    public required string StakeholderId { get; init; }
    public required string Title { get; init; }
    public required string Description { get; init; }
    public required string Quadrant { get; init; }
    public required int Priority { get; init; }
    public required EngagementActionStatus Status { get; init; }
    public DateTime? DueDate { get; init; }
    public DateTime? CompletedDate { get; init; }
    public string? AssignedTo { get; init; }
    public string? Notes { get; init; }
    public required DateTime CreatedAt { get; init; }
    public required DateTime UpdatedAt { get; init; }
}

public record CreateEngagementHistoryRequest
{
    public required string StakeholderId { get; init; }
    public string? ActionId { get; init; }
    public required string Type { get; init; }
    public required string Title { get; init; }
    public required string Description { get; init; }
    public string? Outcome { get; init; }
    public string? Feedback { get; init; }
    public string? Sentiment { get; init; }
    public required DateTime PerformedAt { get; init; }
    public string? NextAction { get; init; }
}

public record CreateEngagementActionRequest
{
    public required string StakeholderId { get; init; }
    public required string Title { get; init; }
    public required string Description { get; init; }
    public required string Quadrant { get; init; }
    public required int Priority { get; init; }
    public DateTime? DueDate { get; init; }
    public string? AssignedTo { get; init; }
}

public record UpdateEngagementActionRequest
{
    public EngagementActionStatus? Status { get; init; }
    public DateTime? CompletedDate { get; init; }
    public string? Notes { get; init; }
    public DateTime? DueDate { get; init; }
    public string? AssignedTo { get; init; }
}
