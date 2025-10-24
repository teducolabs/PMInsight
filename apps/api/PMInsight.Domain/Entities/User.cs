using PMInsight.Domain.Common;
using PMInsight.Domain.Enums;

namespace PMInsight.Domain.Entities;

public class User : TenantEntity
{
    public required string Email { get; set; }
    public required string Name { get; set; }
    public string? Phone { get; set; }
    public required string PasswordHash { get; set; }
    public string? TwoFactorSecret { get; set; }
    public bool TwoFactorEnabled { get; set; }
    public DateTime? LastLoginAt { get; set; }
    public UserStatus Status { get; set; } = UserStatus.Active;
    public List<UserRole> Roles { get; set; } = new();
    public string? RefreshToken { get; set; }
    public DateTime? RefreshTokenExpiry { get; set; }
}
