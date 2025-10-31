using System;
using PMInsight.Application.Services;
using PMInsight.Domain.Common;
using PMInsight.Domain.Entities;

namespace PMInsight.Infrastructure.Persistence;

public class RepositoryFactory
{
    private readonly IMongoContext _context;
    private readonly ITenantContext _tenantContext;

    public RepositoryFactory(IMongoContext context, ITenantContext tenantContext)
    {
        _context = context;
        _tenantContext = tenantContext;
    }

    public IRepository<TUser> Create<TUser>()
        where TUser : BaseEntity
    {
        if (typeof(TUser).IsAssignableTo(typeof(TenantEntity)))
        {
            var instance =
                Activator.CreateInstance(
                    typeof(TenantRepository<>).MakeGenericType(typeof(TUser)),
                    _context,
                    _tenantContext.OrganizationId
                )
                ?? throw new InvalidOperationException(
                    $"Failed to create repository for {typeof(TUser).Name}"
                );

            return (IRepository<TUser>)instance;
        }

        return new MongoRepository<TUser>(_context);
    }
}
