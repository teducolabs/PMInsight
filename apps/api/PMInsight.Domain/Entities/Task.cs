using PMInsight.Domain.Common;
using PMInsight.Domain.Enums;

namespace PMInsight.Domain.Entities;

public class Task : TenantEntity
{
    public required string ProjectId { get; set; }
    public string? WbsId { get; set; }
    public required string Name { get; set; }
    public string? Description { get; set; }
    public List<string> Assignees { get; set; } = new();
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public int Duration { get; set; } // days
    public List<TaskDependency> Predecessors { get; set; } = new();
    public int Progress { get; set; } = 0; // 0-100
    public bool Critical { get; set; }
    public TaskBaseline? Baseline { get; set; }
    public decimal? CostPlanned { get; set; }
    public decimal? CostActual { get; set; }
}

public class TaskDependency
{
    public required string TaskId { get; set; }
    public DependencyType Type { get; set; } = DependencyType.FS;
    public int Lag { get; set; } = 0; // days
}

public class TaskBaseline
{
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public int Duration { get; set; }
}
