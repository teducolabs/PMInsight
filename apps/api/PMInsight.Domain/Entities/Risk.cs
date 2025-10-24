using PMInsight.Domain.Common;
using PMInsight.Domain.Enums;

namespace PMInsight.Domain.Entities;

public class Risk : TenantEntity
{
    public required string ProjectId { get; set; }
    public required string Title { get; set; }
    public string? Cause { get; set; }
    public string? Event { get; set; }
    public string? Effect { get; set; }
    public RiskProbability Probability { get; set; }
    public RiskImpact Impact { get; set; }
    public int Score => (int)Probability * (int)Impact;
    public required string OwnerId { get; set; }
    public RiskStrategy Strategy { get; set; }
    public RiskProbability? ResidualProbability { get; set; }
    public RiskImpact? ResidualImpact { get; set; }
    public int? ResidualScore => ResidualProbability.HasValue && ResidualImpact.HasValue 
        ? (int)ResidualProbability * (int)ResidualImpact 
        : null;
    public RiskStatus Status { get; set; } = RiskStatus.Identified;
}
