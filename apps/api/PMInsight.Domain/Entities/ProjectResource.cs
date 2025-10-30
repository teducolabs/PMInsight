using PMInsight.Domain.Common;

namespace PMInsight.Domain.Entities;

/// <summary>
/// ProjectResource - Pool of resources available in a project
/// Can represent system users OR placeholder resources
/// Single source of truth for resource information
/// Collection name: "project_resources"
/// </summary>
public class ProjectResource : TenantEntity
{
    /// <summary>
    /// Project this resource belongs to
    /// </summary>
    public required string ProjectId { get; set; }

    /// <summary>
    /// Display name of the resource
    /// Examples: "Nguyễn Văn A", "Dev 1", "Senior Backend Developer"
    /// Must be unique within a project
    /// </summary>
    public required string ResourceName { get; set; }

    /// <summary>
    /// Optional: User ID if linked to a system user
    /// Null for placeholder resources
    /// Can be set later when placeholder is converted to user
    /// </summary>
    public string? UserId { get; set; }

    /// <summary>
    /// Role/Position of the resource
    /// Examples: "Backend Developer", "Project Manager", "Tester"
    /// Free-text field, not enum
    /// </summary>
    public string? Role { get; set; }

    /// <summary>
    /// Hourly rate for cost calculation (optional)
    /// Used to calculate planned/actual costs
    /// </summary>
    public decimal? HourlyRate { get; set; }

    /// <summary>
    /// Monthly capacity in hours (e.g., 160h for full-time)
    /// Used for utilization percentage calculation
    /// Null for placeholder resources without defined capacity
    /// </summary>
    public decimal? MonthlyCapacity { get; set; }

    /// <summary>
    /// Soft delete flag
    /// Set to false when resource is deleted
    /// Cannot delete if resource has active assignments
    /// </summary>
    public bool IsActive { get; set; } = true;
}
