namespace PMInsight.Application.Resources.Dtos;

/// <summary>
/// ResourceAssignmentDto - Resource assignment details for a WBS node
/// Now uses ProjectResource from the resource pool
/// </summary>
public record ResourceAssignmentDto
{
    public string Id { get; init; } = string.Empty;
    
    /// <summary>
    /// Reference to ProjectResource from the resource pool
    /// </summary>
    public string? ProjectResourceId { get; init; }
    
    /// <summary>
    /// Resource name from ProjectResource
    /// </summary>
    public string ResourceName { get; init; } = string.Empty;
    
    /// <summary>
    /// Optional: User ID if this resource is linked to a system user
    /// </summary>
    public string? UserId { get; init; }
    
    /// <summary>
    /// User's real name (only if UserId is provided)
    /// </summary>
    public string? UserName { get; init; }
    
    /// <summary>
    /// User's email (only if UserId is provided)
    /// </summary>
    public string? UserEmail { get; init; }
    
    /// <summary>
    /// Role from ProjectResource
    /// </summary>
    public string? Role { get; init; }
    
    /// <summary>
    /// Hourly rate from ProjectResource
    /// </summary>
    public decimal? HourlyRate { get; init; }
    
    public decimal AllocationPercent { get; init; } = 100;
    public DateTime? AssignmentStartDate { get; init; }
    public DateTime? AssignmentEndDate { get; init; }
    public decimal EstimatedHours { get; init; } = 0;
    public decimal ActualHours { get; init; } = 0;
    public decimal? PlannedCost { get; init; }
    public decimal? ActualCost { get; init; }
    public string? Currency { get; init; }
    public bool IsPrimary { get; init; } = false;
    public string? Notes { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime? UpdatedAt { get; init; }
}

/// <summary>
/// Request DTO for adding a resource assignment
/// Now uses ProjectResourceId to reference resources from the pool
/// </summary>
public record AddResourceAssignmentRequest
{
    /// <summary>
    /// Required: ProjectResource ID from the resource pool
    /// </summary>
    public required string ProjectResourceId { get; init; }
    
    public decimal AllocationPercent { get; init; } = 100;
    public DateTime? AssignmentStartDate { get; init; }
    public DateTime? AssignmentEndDate { get; init; }
    public decimal? EstimatedHours { get; init; }
    public decimal? PlannedCost { get; init; }
    public string? Currency { get; init; }
    public bool IsPrimary { get; init; } = false;
    public string? Notes { get; init; }
}

/// <summary>
/// Request DTO for updating a resource assignment
/// </summary>
public record UpdateResourceAssignmentRequest
{
    /// <summary>
    /// Optional: Change the ProjectResource reference
    /// </summary>
    public string? ProjectResourceId { get; init; }
    
    public decimal? AllocationPercent { get; init; }
    public DateTime? AssignmentStartDate { get; init; }
    public DateTime? AssignmentEndDate { get; init; }
    public decimal? EstimatedHours { get; init; }
    public decimal? ActualHours { get; init; }
    public decimal? PlannedCost { get; init; }
    public decimal? ActualCost { get; init; }
    public string? Currency { get; init; }
    public bool? IsPrimary { get; init; }
    public string? Notes { get; init; }
}
