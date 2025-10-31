namespace PMInsight.Domain.Enums;

public enum ProjectStatus
{
    Draft,
    Initiating,
    Planning,
    Executing,
    Monitoring,
    Closing,
    Closed,
    OnHold,
    Cancelled
}

public enum UserRole
{
    Owner,
    Admin,
    PM,
    Coordinator,
    TeamMember,
    Stakeholder,
    Finance,
    QA
}

public enum UserStatus
{
    Active,
    Inactive,
    Suspended
}

public enum RiskProbability
{
    VeryLow = 1,
    Low = 2,
    Medium = 3,
    High = 4,
    VeryHigh = 5
}

public enum RiskImpact
{
    VeryLow = 1,
    Low = 2,
    Medium = 3,
    High = 4,
    VeryHigh = 5
}

public enum RiskStrategy
{
    Avoid,
    Transfer,
    Mitigate,
    Accept
}

public enum RiskStatus
{
    Identified,
    Assessed,
    Mitigated,
    Closed
}

public enum IssuePriority
{
    Low,
    Medium,
    High,
    Critical
}

public enum IssueStatus
{
    Open,
    InProgress,
    Resolved,
    Closed
}

public enum ChangeStatus
{
    Submitted,
    UnderReview,
    Approved,
    Rejected,
    Implemented
}

public enum ChangeDecision
{
    Pending,
    Approved,
    Rejected
}

public enum TimesheetStatus
{
    Draft,
    Submitted,
    Approved,
    Rejected
}

public enum DependencyType
{
    FS, // Finish-to-Start
    SS, // Start-to-Start
    FF, // Finish-to-Finish
    SF  // Start-to-Finish
}

public enum ActivityStatus
{
    NotStarted,
    InProgress,
    Completed,
    OnHold,
    Cancelled
}

public enum ConstraintType
{
    ASAP,  // As Soon As Possible (most flexible)
    ALAP,  // As Late As Possible
    SNET,  // Start No Earlier Than
    SNLT,  // Start No Later Than
    FNET,  // Finish No Earlier Than
    FNLT,  // Finish No Later Than
    MSO,   // Must Start On (rigid)
    MFO    // Must Finish On (rigid)
}

public enum WBSNodeType
{
    Summary,    // Summary task (has children, auto rollup)
    Task,       // Leaf task (executable work)
    Milestone   // Zero-duration milestone
}

public enum ScheduleMode
{
    Auto,        // Dates automatically rollup from children/dependencies
    Manual,      // User override dates
    Fixed        // Fixed date (like milestone)
}

public enum TaskPriority
{
    Low = 1,
    Medium = 2,
    High = 3,
    Critical = 4
}

public enum ContactType
{
    Email,
    Phone,
    Other
}

public enum InfluenceLevel
{
    Low,
    Medium,
    High
}

public enum InterestLevel
{
    Low,
    Medium,
    High
}

public enum StakeholderType
{
    Internal,
    External,
    Customer,
    Vendor,
    Partner
}

public enum EngagementActionStatus
{
    NotStarted,
    InProgress,
    Completed,
    Skipped
}

public enum InsertPosition
{
    Above,   // Insert above target node (same level)
    Below,   // Insert below target node (same level)
    Child    // Insert as child of target node
}
