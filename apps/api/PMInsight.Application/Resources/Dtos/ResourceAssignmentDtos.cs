namespace PMInsight.Application.Resources.Dtos;

/// <summary>
/// ResourceAssignmentDto - Resource assignment details for a WBS node
/// </summary>
public record ResourceAssignmentDto
{
    public string Id { get; init; } = string.Empty;
    public string UserId { get; init; } = string.Empty;
    public string? UserName { get; init; }
    public string? UserEmail { get; init; }
    public decimal AllocationPercent { get; init; } = 100;
    public DateTime? AssignmentStartDate { get; init; }
    public DateTime? AssignmentEndDate { get; init; }
    public decimal EstimatedHours { get; init; } = 0;
    public decimal ActualHours { get; init; } = 0;
    public decimal? PlannedCost { get; init; }
    public decimal? ActualCost { get; init; }
    public string? Currency { get; init; }
    public string? Role { get; init; }
    public bool IsPrimary { get; init; } = false;
    public string? Notes { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime? UpdatedAt { get; init; }
}

/// <summary>
/// Request DTO for adding a resource assignment
/// </summary>
public record AddResourceAssignmentRequest
{
    public required string UserId { get; init; }
    public decimal AllocationPercent { get; init; } = 100;
    public DateTime? AssignmentStartDate { get; init; }
    public DateTime? AssignmentEndDate { get; init; }
    public decimal? EstimatedHours { get; init; }
    public decimal? PlannedCost { get; init; }
    public string? Currency { get; init; }
    public string? Role { get; init; }
    public bool IsPrimary { get; init; } = false;
    public string? Notes { get; init; }
}

/// <summary>
/// Request DTO for updating a resource assignment
/// </summary>
public record UpdateResourceAssignmentRequest
{
    public decimal? AllocationPercent { get; init; }
    public DateTime? AssignmentStartDate { get; init; }
    public DateTime? AssignmentEndDate { get; init; }
    public decimal? EstimatedHours { get; init; }
    public decimal? ActualHours { get; init; }
    public decimal? PlannedCost { get; init; }
    public decimal? ActualCost { get; init; }
    public string? Currency { get; init; }
    public string? Role { get; init; }
    public bool? IsPrimary { get; init; }
    public string? Notes { get; init; }
}
