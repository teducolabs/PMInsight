namespace PMInsight.Domain.Entities;

/// <summary>
/// ResourceAssignment - Represents assignment of a user to a WBS node
/// Tracks allocation percentage, time period, and actual effort
/// </summary>
public class ResourceAssignment
{
    /// <summary>
    /// Unique identifier for this assignment
    /// </summary>
    public string Id { get; set; } = Ulid.NewUlid().ToString();

    /// <summary>
    /// User ID assigned to this task
    /// </summary>
    public required string UserId { get; set; }

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
