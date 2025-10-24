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
    public string? Code { get; set; }
    public string? Description { get; set; }
    public List<string> Deliverables { get; set; } = new();
    public string? AcceptanceCriteria { get; set; }
    public List<WBSNode> Children { get; set; } = new();
}
