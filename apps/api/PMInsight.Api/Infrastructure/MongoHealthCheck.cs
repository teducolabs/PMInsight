using Microsoft.Extensions.Diagnostics.HealthChecks;
using MongoDB.Driver;
using PMInsight.Infrastructure.Persistence;

namespace PMInsight.Api.Infrastructure;

public class MongoHealthCheck : IHealthCheck
{
    private readonly string _connectionString;
    private readonly string _database;

    public MongoHealthCheck(string connectionString, string databaseName)
    {
        _connectionString = connectionString;
        _database = databaseName;
    }

    public async Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken cancellationToken = default)
    {
        try
        {
            var client = new MongoClient(_connectionString);
            await client.GetDatabase(_database).RunCommandAsync<MongoDB.Bson.BsonDocument>("{ ping: 1 }", null, cancellationToken);
            return HealthCheckResult.Healthy();
        }
        catch (Exception ex)
        {
            return HealthCheckResult.Unhealthy(exception: ex);
        }
    }
}