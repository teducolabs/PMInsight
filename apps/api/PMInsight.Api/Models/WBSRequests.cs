using PMInsight.Domain.Entities;

namespace PMInsight.Api.Models;

/// <summary>
/// Request model for creating WBS
/// </summary>
public record CreateWBSRequest
{
    public required string ProjectId { get; init; }
    public List<WBSNode> Tree { get; init; } = new();
}

/// <summary>
/// Request model for updating WBS
/// </summary>
public record UpdateWBSRequest
{
    public List<WBSNode> Tree { get; init; } = new();
}

/// <summary>
/// Request model for adding dependency
/// </summary>
public record AddDependencyRequest
{
    public required string PredecessorNodeId { get; init; }
    public required string Type { get; init; } // FS, SS, FF, SF
    public int LagDays { get; init; } = 0;
}

/// <summary>
/// Request model for updating node progress
/// </summary>
public record UpdateProgressRequest
{
    public decimal PercentComplete { get; init; }
    public DateTime? ActualStartDate { get; init; }
    public DateTime? ActualEndDate { get; init; }
    public decimal? ActualHours { get; init; }
    public decimal? ActualCost { get; init; }
}
