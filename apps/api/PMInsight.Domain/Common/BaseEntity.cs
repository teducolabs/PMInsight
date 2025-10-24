namespace PMInsight.Domain.Common;

public abstract class BaseEntity
{
    public string Id { get; set; } = Ulid.NewUlid().ToString();
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? DeletedAt { get; set; }
}

public abstract class TenantEntity : BaseEntity
{
    public required string OrganizationId { get; set; }
}
