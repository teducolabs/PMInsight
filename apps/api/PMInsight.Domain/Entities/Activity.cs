using PMInsight.Domain.Common;

namespace PMInsight.Domain.Entities;

public class Activity : TenantEntity
{
    public required string ActorUserId { get; set; }
    public required string Type { get; set; }
    public required string Action { get; set; }
    public required string Resource { get; set; }
    public required string ResourceId { get; set; }
    public Dictionary<string, object> Metadata { get; set; } = new();
    public string? Ip { get; set; }
}
