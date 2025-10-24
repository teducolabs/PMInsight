using MongoDB.Driver;
using PMInsight.Domain.Common;
using PMInsight.Domain.Entities;

namespace PMInsight.Infrastructure.Persistence;

public interface ITenantRepository<T> : IRepository<T> where T : TenantEntity
{
    Task<List<T>> GetByOrganizationAsync(string organizationId, CancellationToken cancellationToken = default);
}

public class TenantRepository<T> : MongoRepository<T>, ITenantRepository<T> where T : TenantEntity
{
    private readonly string _organizationId;

    public TenantRepository(IMongoContext context, string organizationId, string? collectionName = null)
        : base(context, collectionName)
    {
        _organizationId = organizationId;
    }

    public async Task<List<T>> GetByOrganizationAsync(string organizationId, CancellationToken cancellationToken = default)
    {
        var filter = Builders<T>.Filter.And(
            Builders<T>.Filter.Eq(x => x.OrganizationId, organizationId),
            Builders<T>.Filter.Eq(x => x.DeletedAt, null)
        );
        return await _collection.Find(filter).ToListAsync(cancellationToken);
    }

    public override async Task<T?> GetByIdAsync(string id, CancellationToken cancellationToken = default)
    {
        var filter = Builders<T>.Filter.And(
            Builders<T>.Filter.Eq(x => x.Id, id),
            Builders<T>.Filter.Eq(x => x.OrganizationId, _organizationId),
            Builders<T>.Filter.Eq(x => x.DeletedAt, null)
        );
        return await _collection.Find(filter).FirstOrDefaultAsync(cancellationToken);
    }

    public override async Task<List<T>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await GetByOrganizationAsync(_organizationId, cancellationToken);
    }
}
