using PMInsight.Domain.Common;
using PMInsight.Domain.Enums;

namespace PMInsight.Domain.Entities;

public class Project : TenantEntity
{
    public required string Code { get; set; }
    public required string Name { get; set; }
    public string? Description { get; set; }
    public required string OwnerId { get; set; }
    public ProjectStatus Status { get; set; } = ProjectStatus.Draft;
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public string? Portfolio { get; set; }
    public List<string> Tags { get; set; } = new();
    public List<Baseline> Baselines { get; set; } = new();
}

public class Baseline
{
    public string? ScopeId { get; set; }
    public string? ScheduleId { get; set; }
    public string? CostId { get; set; }
    public int Version { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public required string CreatedBy { get; set; }
}
