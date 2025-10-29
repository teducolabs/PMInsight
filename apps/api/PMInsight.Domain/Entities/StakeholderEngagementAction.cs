using PMInsight.Domain.Common;
using PMInsight.Domain.Enums;

namespace PMInsight.Domain.Entities;

public class StakeholderEngagementAction : TenantEntity
{
    public required string StakeholderId { get; set; }
    public required string Title { get; set; }
    public required string Description { get; set; }
    public required string Quadrant { get; set; } // manage-closely, keep-satisfied, keep-informed, monitor
    public required int Priority { get; set; } // 1=Critical, 2=High, 3=Medium, 4=Low
    public required EngagementActionStatus Status { get; set; }
    public DateTime? DueDate { get; set; }
    public DateTime? CompletedDate { get; set; }
    public string? AssignedTo { get; set; }
    public string? Notes { get; set; }
}
