namespace PMInsight.Domain.Entities;

/// <summary>
/// ResourceAssignment - Represents assignment of a resource to a WBS node
/// Can be linked to a system user OR be a placeholder resource (e.g., "Dev 1", "Tester 2")
/// Tracks allocation percentage, time period, and actual effort
/// </summary>
public class ResourceAssignment
{
    /// <summary>
    /// Unique identifier for this assignment
    /// </summary>
    public string Id { get; set; } = Ulid.NewUlid().ToString();

    /// <summary>
    /// Reference to ProjectResource from the resource pool
    /// This is the NEW approach - resources are defined once in the pool and referenced here
    /// </summary>
    public string? ProjectResourceId { get; set; }

    /// <summary>
    /// DEPRECATED: Optional: User ID if linked to a system user
    /// Null for placeholder resources (e.g., "Dev 1", "Senior Backend Dev")
    /// Can be set later when user joins the system
    /// KEPT FOR BACKWARD COMPATIBILITY - Use ProjectResourceId instead
    /// </summary>
    public string? UserId { get; set; }

    /// <summary>
    /// DEPRECATED: Resource name - REQUIRED
    /// - For system users: Will be overridden by user's real name
    /// - For placeholders: Custom name like "Dev 1", "Senior Backend Developer"
    /// - Can be edited anytime
    /// KEPT FOR BACKWARD COMPATIBILITY - Use ProjectResourceId instead
    /// </summary>
    public required string ResourceName { get; set; }

    /// <summary>
    /// Allocation percentage (0-100)
    /// e.g., 50 = half-time, 100 = full-time
    /// </summary>
    public decimal AllocationPercent { get; set; } = 100;

    /// <summary>
    /// Start date of assignment period
    /// If null, uses WBSNode's PlannedStartDate
    /// </summary>
    public DateTime? AssignmentStartDate { get; set; }

    /// <summary>
    /// End date of assignment period
    /// If null, uses WBSNode's PlannedEndDate
    /// </summary>
    public DateTime? AssignmentEndDate { get; set; }

    /// <summary>
    /// Estimated hours for this resource on this task
    /// Can differ from WBSNode.EstimatedHours if multiple resources
    /// </summary>
    public decimal EstimatedHours { get; set; } = 0;

    /// <summary>
    /// Actual hours worked by this resource
    /// Sum of all timesheet entries for this user + task
    /// </summary>
    public decimal ActualHours { get; set; } = 0;

    /// <summary>
    /// Planned cost for this resource assignment
    /// Calculated: EstimatedHours * UserHourlyRate
    /// </summary>
    public decimal? PlannedCost { get; set; }

    /// <summary>
    /// Actual cost for this resource
    /// Calculated: ActualHours * UserHourlyRate
    /// </summary>
    public decimal? ActualCost { get; set; }

    /// <summary>
    /// Currency for cost tracking
    /// Inherits from WBSNode or Project
    /// </summary>
    public string? Currency { get; set; } = "VND";

    /// <summary>
    /// Role of the resource on this task
    /// e.g., "Developer", "Tester", "Reviewer"
    /// </summary>
    public string? Role { get; set; }

    /// <summary>
    /// Is this the primary/responsible resource?
    /// Only one resource should be primary per task
    /// </summary>
    public bool IsPrimary { get; set; } = false;

    /// <summary>
    /// Notes specific to this resource assignment
    /// </summary>
    public string? Notes { get; set; }

    /// <summary>
    /// Date this assignment was created
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Date this assignment was last modified
    /// </summary>
    public DateTime? UpdatedAt { get; set; }

    /// <summary>
    /// User who created this assignment
    /// </summary>
    public string? CreatedBy { get; set; }

    /// <summary>
    /// User who last modified this assignment
    /// </summary>
    public string? UpdatedBy { get; set; }
}
