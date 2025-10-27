namespace PMInsight.Application.Common.Interfaces;

public interface ICurrentUserService
{
    string? UserId { get; }
    string? OrganizationId { get; }
    IEnumerable<string> Roles { get; }
    bool IsAuthenticated { get; }
}
