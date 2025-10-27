using MongoDB.Driver;
using PMInsight.Domain.Entities;

namespace PMInsight.Infrastructure.Persistence;

public static class MongoIndexConfiguration
{
    public static async System.Threading.Tasks.Task ConfigureIndexesAsync(IMongoContext context)
    {
        // Organizations
        var orgsCollection = context.GetCollection<Organization>();
        await orgsCollection.Indexes.CreateOneAsync(
            new CreateIndexModel<Organization>(
                Builders<Organization>.IndexKeys.Ascending(x => x.Slug),
                new CreateIndexOptions { Unique = true }
            )
        );

        // Users
        var usersCollection = context.GetCollection<User>();
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
        var projectsCollection = context.GetCollection<Project>();
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

        // Schedule Activities
        var activitiesCollection = context.GetCollection<ScheduleActivity>();
        await activitiesCollection.Indexes.CreateManyAsync(new[]
        {
            new CreateIndexModel<ScheduleActivity>(
                Builders<ScheduleActivity>.IndexKeys
                    .Ascending(x => x.OrganizationId)
                    .Ascending(x => x.ProjectId)
                    .Descending(x => x.CreatedAt)
            ),
            new CreateIndexModel<ScheduleActivity>(
                Builders<ScheduleActivity>.IndexKeys
                    .Ascending(x => x.OrganizationId)
                    .Ascending(x => x.ProjectId)
                    .Ascending("AssignedUserIds")
            )
        });

        // Risks
        var risksCollection = context.GetCollection<Risk>();
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
        var issuesCollection = context.GetCollection<Issue>();
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
        var changesCollection = context.GetCollection<ChangeRequest>();
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
        var timesheetsCollection = context.GetCollection<Timesheet>();
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
