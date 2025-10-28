using PMInsight.Domain.Common;
using PMInsight.Domain.Enums;

namespace PMInsight.Domain.Entities;

public class Stakeholder : TenantEntity
{
    public required string ProjectId { get; set; }
    public required string Name { get; set; }
    public required string Role { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public StakeholderType Type { get; set; }
    public InfluenceLevel Influence { get; set; }
    public InterestLevel Interest { get; set; }
    public string? CommunicationPreference { get; set; }
    public string? Notes { get; set; }
}
