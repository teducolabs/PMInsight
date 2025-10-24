using PMInsight.Domain.Common;
using PMInsight.Domain.Enums;

namespace PMInsight.Domain.Entities;

public class ChangeRequest : TenantEntity
{
    public required string ProjectId { get; set; }
    public required string Title { get; set; }
    public required string Reason { get; set; }
    public ChangeImpact Impact { get; set; } = new();
    public ChangeDecision Decision { get; set; } = ChangeDecision.Pending;
    public string? DecidedBy { get; set; }
    public DateTime? DecidedAt { get; set; }
    public ChangeStatus Status { get; set; } = ChangeStatus.Submitted;
    public Dictionary<string, object>? Diffs { get; set; }
}

public class ChangeImpact
{
    public string? Scope { get; set; }
    public string? Schedule { get; set; }
    public string? Cost { get; set; }
    public string? Quality { get; set; }
    public string? Risk { get; set; }
}
