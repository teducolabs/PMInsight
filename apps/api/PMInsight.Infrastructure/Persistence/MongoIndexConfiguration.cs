using MongoDB.Driver;
using PMInsight.Domain.Entities;

namespace PMInsight.Infrastructure.Persistence;

public static class MongoIndexConfiguration
{
    public static async System.Threading.Tasks.Task ConfigureIndexesAsync(IMongoContext context)
    {
        // Organizations
        var orgsCollection = context.GetCollection<Organization>("Organizations");
        await orgsCollection.Indexes.CreateOneAsync(
            new CreateIndexModel<Organization>(
                Builders<Organization>.IndexKeys.Ascending(x => x.Slug),
                new CreateIndexOptions { Unique = true }
            )
        );

        // Users
        var usersCollection = context.GetCollection<User>("Users");
        await usersCollection.Indexes.CreateManyAsync(new[]
        {
            new CreateIndexModel<User>(
                Builders<User>.IndexKeys
                    .Ascending(x => x.OrganizationId)
                    .Ascending(x => x.Email),
                new CreateIndexOptions { Unique = true }
            ),
            new CreateIndexModel<User>(
                Builders<User>.IndexKeys
                    .Ascending(x => x.OrganizationId)
                    .Ascending(x => x.Status)
                    .Descending(x => x.CreatedAt)
            )
        });

        // Projects
        var projectsCollection = context.GetCollection<Project>("Projects");
        await projectsCollection.Indexes.CreateManyAsync(new[]
        {
            new CreateIndexModel<Project>(
                Builders<Project>.IndexKeys
                    .Ascending(x => x.OrganizationId)
                    .Ascending(x => x.Status)
                    .Descending(x => x.CreatedAt)
            ),
            new CreateIndexModel<Project>(
                Builders<Project>.IndexKeys
                    .Ascending(x => x.OrganizationId)
                    .Ascending(x => x.Code),
                new CreateIndexOptions { Unique = true }
            ),
            new CreateIndexModel<Project>(
                Builders<Project>.IndexKeys.Text(x => x.Name)
            )
        });

        // WBS - Index on nodes within tree (activities are now part of WBS nodes)
        var wbsCollection = context.GetCollection<WBS>("WBSs");
        await wbsCollection.Indexes.CreateManyAsync(new[]
        {
            new CreateIndexModel<WBS>(
                Builders<WBS>.IndexKeys
                    .Ascending(x => x.OrganizationId)
                    .Ascending(x => x.ProjectId),
                new CreateIndexOptions { Unique = true }
            ),
            new CreateIndexModel<WBS>(
                Builders<WBS>.IndexKeys
                    .Ascending(x => x.OrganizationId)
                    .Ascending(x => x.ProjectId)
                    .Descending(x => x.Version)
            )
        });

        // Risks
        var risksCollection = context.GetCollection<Risk>("Risks");
        await risksCollection.Indexes.CreateManyAsync(new[]
        {
            new CreateIndexModel<Risk>(
                Builders<Risk>.IndexKeys
                    .Ascending(x => x.OrganizationId)
                    .Ascending(x => x.ProjectId)
                    .Ascending(x => x.Status)
            ),
            new CreateIndexModel<Risk>(
                Builders<Risk>.IndexKeys.Text(x => x.Title)
            )
        });

        // Issues
        var issuesCollection = context.GetCollection<Issue>("Issues");
        await issuesCollection.Indexes.CreateManyAsync(new[]
        {
            new CreateIndexModel<Issue>(
                Builders<Issue>.IndexKeys
                    .Ascending(x => x.OrganizationId)
                    .Ascending(x => x.ProjectId)
                    .Ascending(x => x.Status)
            ),
            new CreateIndexModel<Issue>(
                Builders<Issue>.IndexKeys
                    .Ascending(x => x.OrganizationId)
                    .Ascending(x => x.ProjectId)
                    .Ascending(x => x.Priority)
            )
        });

        // Change Requests
        var changesCollection = context.GetCollection<ChangeRequest>("ChangeRequests");
        await changesCollection.Indexes.CreateManyAsync(new[]
        {
            new CreateIndexModel<ChangeRequest>(
                Builders<ChangeRequest>.IndexKeys
                    .Ascending(x => x.OrganizationId)
                    .Ascending(x => x.ProjectId)
                    .Ascending(x => x.Status)
            )
        });

        // Timesheets
        var timesheetsCollection = context.GetCollection<Timesheet>("Timesheets");
        await timesheetsCollection.Indexes.CreateManyAsync(new[]
        {
            new CreateIndexModel<Timesheet>(
                Builders<Timesheet>.IndexKeys
                    .Ascending(x => x.OrganizationId)
                    .Ascending(x => x.UserId)
                    .Ascending(x => x.WeekStart)
            ),
            new CreateIndexModel<Timesheet>(
                Builders<Timesheet>.IndexKeys
                    .Ascending(x => x.OrganizationId)
                    .Ascending(x => x.ProjectId)
                    .Ascending(x => x.Status)
            )
        });

        Console.WriteLine("✓ MongoDB indexes configured successfully");
    }
}
