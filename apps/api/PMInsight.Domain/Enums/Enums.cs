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
