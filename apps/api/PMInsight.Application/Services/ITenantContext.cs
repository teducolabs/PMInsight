using System;

namespace PMInsight.Application.Services;

public interface ITenantContext
{
    string OrganizationId { get; }
    void SetOrganizationId(string organizationId);
}

public class TenantContext : ITenantContext
{
    private string _organizationId = "default";

    public string OrganizationId => _organizationId;

    public void SetOrganizationId(string organizationId)
    {
        _organizationId = organizationId ?? throw new ArgumentNullException(nameof(organizationId));
    }
}