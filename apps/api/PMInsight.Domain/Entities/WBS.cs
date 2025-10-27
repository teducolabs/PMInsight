using PMInsight.Domain.Common;

namespace PMInsight.Domain.Entities;

public class WBS : TenantEntity
{
    public required string ProjectId { get; set; }
    public List<WBSNode> Tree { get; set; } = new();
    public int Version { get; set; } = 1;
    public string? BaselineRef { get; set; }
    public string? LockedBy { get; set; }
    public DateTime? LockedAt { get; set; }
}

public class WBSNode
{
    public string Id { get; set; } = Ulid.NewUlid().ToString();
    public required string Name { get; set; }
    public string? Code { get; set; }  // WBS Code (e.g., 1.1.2)
    public string? Description { get; set; }
    
    // Scope definition (PMI Scope Management)
    public List<string> Deliverables { get; set; } = new();
    public string? AcceptanceCriteria { get; set; }
    
    // Cost estimation (PMI Cost Management)
    public decimal? EstimatedCost { get; set; }
    public string? Currency { get; set; }
    
    // Responsibility assignment
    public string? ResponsibleOrganization { get; set; }
    public string? ResponsibleUserId { get; set; }
    
    // Scope constraints and assumptions
    public List<string> Assumptions { get; set; } = new();
    public List<string> Constraints { get; set; } = new();
    
    // Hierarchy
    public List<WBSNode> Children { get; set; } = new();
    
    // Metadata
    public bool IsWorkPackage { get; set; }  // True if leaf node
    public int Level { get; set; }  // Depth in tree (1 = root)
}
