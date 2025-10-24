using PMInsight.Domain.Common;
using PMInsight.Domain.Enums;

namespace PMInsight.Domain.Entities;

public class Stakeholder : TenantEntity
{
    public required string ProjectId { get; set; }
    public required string Name { get; set; }
    public required string Role { get; set; }
    public InfluenceLevel Influence { get; set; }
    public InterestLevel Interest { get; set; }
    public string? EngagementPlan { get; set; }
    public List<Contact> Contacts { get; set; } = new();
}

public class Contact
{
    public ContactType Type { get; set; }
    public required string Value { get; set; }
}
