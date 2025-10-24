using MongoDB.Driver;

namespace PMInsight.Infrastructure.Persistence;

public interface IMongoContext
{
    IMongoDatabase Database { get; }
    IMongoCollection<T> GetCollection<T>(string? name = null);
}

public class MongoContext : IMongoContext
{
    private readonly IMongoDatabase _database;

    public MongoContext(string connectionString, string databaseName)
    {
        var client = new MongoClient(connectionString);
        _database = client.GetDatabase(databaseName);
    }

    public IMongoDatabase Database => _database;

    public IMongoCollection<T> GetCollection<T>(string? name = null)
    {
        var collectionName = name ?? typeof(T).Name.ToLowerInvariant() + "s";
        return _database.GetCollection<T>(collectionName);
    }
}
