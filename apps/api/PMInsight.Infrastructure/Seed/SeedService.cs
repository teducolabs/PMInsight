using Microsoft.AspNetCore.Identity;
using MongoDB.Driver;
using PMInsight.Application.Common.Interfaces;
using PMInsight.Domain.Entities;
using PMInsight.Domain.Enums;
using System.Text.Json;
using TaskAlias = System.Threading.Tasks.Task;

namespace PMInsight.Infrastructure.Seed;

public class SeedService : ISeedService
{
    private readonly IMongoDatabase _database;
    private readonly IPasswordHasher<User> _passwordHasher;

    public SeedService(IMongoDatabase database, IPasswordHasher<User> passwordHasher)
    {
        _database = database;
        _passwordHasher = passwordHasher;
    }

    public async TaskAlias SeedAsync()
    {
        // Simple seed implementation
        var organization = await CreateOrganizationAsync();
        var admin = await CreateAdminUserAsync(organization.Id);
        await CreateSampleProjectsAsync(organization.Id, admin.Id);
    }

    private async Task<Organization> CreateOrganizationAsync()
    {
        var orgs = _database.GetCollection<Organization>("Organizations");
        var existing = await orgs.Find(o => o.Name == "Demo Org").FirstOrDefaultAsync();
        if (existing != null) return existing;
        
        var org = new Organization
        {
            OrganizationId = string.Empty, // Will be self-referencing after save
            Name = "Demo Org",
            Slug = "demo-org",
            Description = "Sample organization for testing"
        };
        
        // MongoDB will generate the Id
        await orgs.InsertOneAsync(org);
        
        // Update OrganizationId to self-reference
        org.OrganizationId = org.Id;
        await orgs.ReplaceOneAsync(o => o.Id == org.Id, org);
        
        return org;
    }

    private async Task<User> CreateAdminUserAsync(string orgId)
    {
        var users = _database.GetCollection<User>("Users");
        var existing = await users.Find(u => u.Email == "admin@demo.com").FirstOrDefaultAsync();
        if (existing != null) return existing;
        
        var user = new User
        {
            OrganizationId = orgId,
            Email = "admin@demo.com",
            Name = "Admin User",
            PasswordHash = _passwordHasher.HashPassword(null, "Admin@123"),
            Status = UserStatus.Active,
            Roles = new List<UserRole> { UserRole.Admin }
        };
        
        await users.InsertOneAsync(user);
        return user;
    }

    private async TaskAlias CreateSampleProjectsAsync(string orgId, string ownerId)
    {
        var projects = _database.GetCollection<Project>("Projects");
        var existingCount = await projects.CountDocumentsAsync(p => p.OrganizationId == orgId);
        if (existingCount > 0) return; // Already seeded

        var sampleProjects = new List<Project>
        {
            new Project
            {
                OrganizationId = orgId,
                Code = "WEB-001",
                Name = "Website Redesign 2025",
                Description = "Complete redesign of company website with modern UI/UX",
                OwnerId = ownerId,
                Status = ProjectStatus.Executing,
                Priority = "High",
                StartDate = DateTime.UtcNow.AddDays(-30),
                EndDate = DateTime.UtcNow.AddDays(60),
                Budget = 150000000,
                Currency = "VND",
                Progress = 65,
                Health = "Green"
            },
            new Project
            {
                OrganizationId = orgId,
                Code = "APP-001",
                Name = "Mobile App Development",
                Description = "Native iOS and Android app for customer engagement",
                OwnerId = ownerId,
                Status = ProjectStatus.Planning,
                Priority = "Critical",
                StartDate = DateTime.UtcNow.AddDays(-10),
                EndDate = DateTime.UtcNow.AddDays(90),
                Budget = 300000000,
                Currency = "VND",
                Progress = 25,
                Health = "Yellow"
            },
            new Project
            {
                OrganizationId = orgId,
                Code = "CRM-001",
                Name = "CRM System Implementation",
                Description = "Salesforce CRM implementation and customization",
                OwnerId = ownerId,
                Status = ProjectStatus.Executing,
                Priority = "Medium",
                StartDate = DateTime.UtcNow.AddDays(-45),
                EndDate = DateTime.UtcNow.AddDays(30),
                Budget = 200000000,
                Currency = "VND",
                Progress = 80,
                Health = "Green"
            },
            new Project
            {
                OrganizationId = orgId,
                Code = "EVENT-001",
                Name = "Annual Tech Conference",
                Description = "Organize company annual tech conference with 500+ attendees",
                OwnerId = ownerId,
                Status = ProjectStatus.Planning,
                Priority = "High",
                StartDate = DateTime.UtcNow.AddDays(10),
                EndDate = DateTime.UtcNow.AddDays(120),
                Budget = 500000000,
                Currency = "VND",
                Progress = 15,
                Health = "Green"
            },
            new Project
            {
                OrganizationId = orgId,
                Code = "INFRA-001",
                Name = "Cloud Migration Project",
                Description = "Migrate on-premise infrastructure to AWS cloud",
                OwnerId = ownerId,
                Status = ProjectStatus.OnHold,
                Priority = "Medium",
                StartDate = DateTime.UtcNow.AddDays(-60),
                EndDate = DateTime.UtcNow.AddDays(90),
                Budget = 400000000,
                Currency = "VND",
                Progress = 40,
                Health = "Red"
            },
            new Project
            {
                OrganizationId = orgId,
                Code = "TRAIN-001",
                Name = "Employee Training Program",
                Description = "Comprehensive training program for new PM methodology",
                OwnerId = ownerId,
                Status = ProjectStatus.Closed,
                Priority = "Low",
                StartDate = DateTime.UtcNow.AddDays(-90),
                EndDate = DateTime.UtcNow.AddDays(-10),
                Budget = 50000000,
                Currency = "VND",
                Progress = 100,
                Health = "Green"
            }
        };

        await projects.InsertManyAsync(sampleProjects);
    }
}
