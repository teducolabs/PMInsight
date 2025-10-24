using PMInsight.Domain.Common;

namespace PMInsight.Domain.Entities;

public class Budget : TenantEntity
{
    public required string ProjectId { get; set; }
    public List<BudgetCategory> Categories { get; set; } = new();
    public decimal Baseline { get; set; }
    public decimal? CPI { get; set; } // Cost Performance Index
    public decimal? SPI { get; set; } // Schedule Performance Index
}

public class BudgetCategory
{
    public string Id { get; set; } = Ulid.NewUlid().ToString();
    public required string Name { get; set; }
    public decimal Planned { get; set; }
    public decimal Actual { get; set; }
}
