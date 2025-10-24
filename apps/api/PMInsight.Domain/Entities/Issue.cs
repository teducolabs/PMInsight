using PMInsight.Domain.Common;
using PMInsight.Domain.Enums;

namespace PMInsight.Domain.Entities;

public class Issue : TenantEntity
{
    public required string ProjectId { get; set; }
    public required string Title { get; set; }
    public string? Description { get; set; }
    public IssuePriority Priority { get; set; }
    public required string OwnerId { get; set; }
    public DateTime? DueDate { get; set; }
    public IssueStatus Status { get; set; } = IssueStatus.Open;
    public IssueLinks Links { get; set; } = new();
}

public class IssueLinks
{
    public string? ChangeId { get; set; }
    public string? TaskId { get; set; }
}
