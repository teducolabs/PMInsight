namespace PMInsight.Application.ProjectResources.Dtos;

/// <summary>
/// DTO for ProjectResource with utilization stats
/// </summary>
public record ProjectResourceDto
{
    public required string Id { get; init; }
    public required string ProjectId { get; init; }
    public required string ResourceName { get; init; }
    public string? UserId { get; init; }
    public string? Role { get; init; }
    public decimal? HourlyRate { get; init; }
    public decimal? MonthlyCapacity { get; init; }
    public bool IsActive { get; init; }
    
    // Calculated utilization stats
    public int AssignmentCount { get; init; }
    public decimal TotalAllocatedHours { get; init; }
    public decimal UtilizationPercent { get; init; }
}

/// <summary>
/// Request to create a new resource in project pool
/// </summary>
public record CreateProjectResourceRequest
{
    /// <summary>
    /// Display name (unique within project)
    /// Examples: "Dev 1", "Nguyễn Văn A", "Senior Backend Developer"
    /// </summary>
    public required string ResourceName { get; init; }
    
    /// <summary>
    /// Optional: Link to system user
    /// </summary>
    public string? UserId { get; init; }
    
    /// <summary>
    /// Role/Position (free text)
    /// Examples: "Backend Developer", "Tester", "PM"
    /// </summary>
    public string? Role { get; init; }
    
    /// <summary>
    /// Hourly rate for cost calculation
    /// </summary>
    public decimal? HourlyRate { get; init; }
    
    /// <summary>
    /// Monthly capacity in hours (e.g., 160h full-time)
    /// </summary>
    public decimal? MonthlyCapacity { get; init; }
}

/// <summary>
/// Request to update existing resource
/// </summary>
public record UpdateProjectResourceRequest
{
    public required string ResourceName { get; init; }
    public string? UserId { get; init; }
    public string? Role { get; init; }
    public decimal? HourlyRate { get; init; }
    public decimal? MonthlyCapacity { get; init; }
}
