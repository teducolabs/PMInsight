using Microsoft.AspNetCore.Http;
using PMInsight.Application.Common.Interfaces;
using PMInsight.Application.Services;

namespace PMInsight.Api.Infrastructure;

public class TenantContextMiddleware
{
    private readonly RequestDelegate _next;

    public TenantContextMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context, ITenantContext tenantContext, ICurrentUserService currentUserService)
    {
        // Set organization ID from current user (JWT claims)
        if (currentUserService.IsAuthenticated && !string.IsNullOrEmpty(currentUserService.OrganizationId))
        {
            tenantContext.SetOrganizationId(currentUserService.OrganizationId!);
        }

        await _next(context);
    }
}

public static class TenantContextMiddlewareExtensions
{
    public static IApplicationBuilder UseTenantContext(this IApplicationBuilder builder)
    {
        return builder.UseMiddleware<TenantContextMiddleware>();
    }
}
