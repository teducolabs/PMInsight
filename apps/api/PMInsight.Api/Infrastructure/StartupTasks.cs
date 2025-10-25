using PMInsight.Infrastructure.Persistence;

namespace PMInsight.Api.Infrastructure;

public static class StartupTasks
{
    public static async Task ConfigureMongoIndexesAsync(IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var mongoContext = scope.ServiceProvider.GetRequiredService<IMongoContext>();
        await MongoIndexConfiguration.ConfigureIndexesAsync(mongoContext);
        Console.WriteLine("✓ MongoDB indexes configured successfully");
    }
}