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
}
