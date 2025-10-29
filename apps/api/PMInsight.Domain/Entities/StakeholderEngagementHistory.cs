using PMInsight.Domain.Common;

namespace PMInsight.Domain.Entities;

public class StakeholderEngagementHistory : TenantEntity
{
    public required string StakeholderId { get; set; }
    public string? ActionId { get; set; }
    public required string Type { get; set; } // meeting, email, call, update, feedback, other
    public required string Title { get; set; }
    public required string Description { get; set; }
    public string? Outcome { get; set; }
    public string? Feedback { get; set; }
    public string? Sentiment { get; set; } // positive, neutral, negative
    public required string PerformedBy { get; set; }
    public required DateTime PerformedAt { get; set; }
    public string? NextAction { get; set; }
}
