using PMInsight.Domain.Common;
using PMInsight.Domain.Enums;

namespace PMInsight.Domain.Entities;

public class Timesheet : TenantEntity
{
    public required string UserId { get; set; }
    public required string ProjectId { get; set; }
    public DateTime WeekStart { get; set; }
    public List<TimesheetEntry> Entries { get; set; } = new();
    public TimesheetStatus Status { get; set; } = TimesheetStatus.Draft;
    public string? ApprovedBy { get; set; }
    public DateTime? ApprovedAt { get; set; }
}

public class TimesheetEntry
{
    public required string TaskId { get; set; }
    public decimal Hours { get; set; }
    public string? Note { get; set; }
}
