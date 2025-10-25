using PMInsight.Domain.Common;

namespace PMInsight.Domain.Entities;

public class Organization : TenantEntity
{
    public required string Name { get; set; }
    public required string Slug { get; set; }
    public string? Description { get; set; }
    public Dictionary<string, string> Settings { get; set; } = new();
}
