using PMInsight.Domain.Common;
using PMInsight.Domain.Enums;

namespace PMInsight.Domain.Entities;

public class Project : TenantEntity
{
    public required string Code { get; set; }
    public required string Name { get; set; }
    public string? Description { get; set; }
    public required string OwnerId { get; set; } // Project Manager
    public ProjectStatus Status { get; set; } = ProjectStatus.Initiating;
    public string Priority { get; set; } = "Medium"; // Low, Medium, High, Critical
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public DateTime? ActualStartDate { get; set; }
    public DateTime? ActualEndDate { get; set; }
    public double? Budget { get; set; }
    public string Currency { get; set; } = "VND";
    public int Progress { get; set; } = 0; // 0-100
    public string Health { get; set; } = "Green"; // Green, Yellow, Red (RAG)
    public string? SponsorId { get; set; }
    public string? TemplateId { get; set; }
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
