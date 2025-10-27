using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using PMInsight.Infrastructure.Persistence;
using PMInsight.Application.Services;
using PMInsight.Application.Common.Interfaces;
using PMInsight.Domain.Entities;
using PMInsight.Domain.Common;
using PMInsight.Api.Infrastructure;
using FluentValidation;
using FluentValidation.AspNetCore;
using Serilog;
using System.Text;
using MongoDB.Driver;
using Microsoft.AspNetCore.RateLimiting;

var builder = WebApplication.CreateBuilder(args);

// ============================================================================
// Configuration
// ============================================================================
var mongoConnection = builder.Configuration["MONGODB_CONNECTION_STRING"] ?? "mongodb://localhost:27017";
var mongoDatabase = builder.Configuration["MONGODB_DATABASE_NAME"] ?? "pminsight";
var jwtSecret = builder.Configuration["JWT_SECRET"] ?? throw new InvalidOperationException("JWT_SECRET not configured");
var jwtIssuer = builder.Configuration["JWT_ISSUER"] ?? "PMInsight";
var jwtAudience = builder.Configuration["JWT_AUDIENCE"] ?? "PMInsightApp";
var corsOrigins = builder.Configuration["CORS_ORIGINS"]?.Split(',') ?? new[] { "http://localhost:5173" };

// ============================================================================
// Services
// ============================================================================

// MongoDB Context & Repositories
builder.Services.AddSingleton<IMongoContext>(sp => new MongoContext(mongoConnection, mongoDatabase));

// Tenant Context
builder.Services.AddScoped<ITenantContext, TenantContext>();

// HttpContextAccessor for 2FA handlers
builder.Services.AddHttpContextAccessor();

// Current User Service
builder.Services.AddScoped<ICurrentUserService, PMInsight.Infrastructure.Services.CurrentUserService>();

// Register repositories for all entities
builder.Services.AddScoped<IRepository<User>>(sp => {
    var context = sp.GetRequiredService<IMongoContext>();
    var tenantContext = sp.GetRequiredService<ITenantContext>();
    return new TenantRepository<User>(context, tenantContext.OrganizationId, "Users");
});

builder.Services.AddScoped<IRepository<Organization>>(sp => {
    var context = sp.GetRequiredService<IMongoContext>();
    var tenantContext = sp.GetRequiredService<ITenantContext>();
    return new TenantRepository<Organization>(context, tenantContext.OrganizationId, "Organizations");
});

builder.Services.AddScoped<IRepository<Stakeholder>>(sp => {
    var context = sp.GetRequiredService<IMongoContext>();
    var tenantContext = sp.GetRequiredService<ITenantContext>();
    return new TenantRepository<Stakeholder>(context, tenantContext.OrganizationId, "Stakeholders");
});

builder.Services.AddScoped<IRepository<Project>>(sp => {
    var context = sp.GetRequiredService<IMongoContext>();
    var tenantContext = sp.GetRequiredService<ITenantContext>();
    return new TenantRepository<Project>(context, tenantContext.OrganizationId, "Projects");
});

builder.Services.AddScoped<IRepository<Risk>>(sp => {
    var context = sp.GetRequiredService<IMongoContext>();
    var tenantContext = sp.GetRequiredService<ITenantContext>();
    return new TenantRepository<Risk>(context, tenantContext.OrganizationId, "Risks");
});

builder.Services.AddScoped<IRepository<Issue>>(sp => {
    var context = sp.GetRequiredService<IMongoContext>();
    var tenantContext = sp.GetRequiredService<ITenantContext>();
    return new TenantRepository<Issue>(context, tenantContext.OrganizationId, "Issues");
});

builder.Services.AddScoped<IRepository<ScheduleActivity>>(sp => {
    var context = sp.GetRequiredService<IMongoContext>();
    var tenantContext = sp.GetRequiredService<ITenantContext>();
    return new TenantRepository<ScheduleActivity>(context, tenantContext.OrganizationId, "ScheduleActivities");
});

builder.Services.AddScoped<IRepository<WBS>>(sp => {
    var context = sp.GetRequiredService<IMongoContext>();
    var tenantContext = sp.GetRequiredService<ITenantContext>();
    return new TenantRepository<WBS>(context, tenantContext.OrganizationId, "WBSs");
});

// CORS
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins(corsOrigins)
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

// Authentication & Authorization
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
            ClockSkew = TimeSpan.Zero
        };
    });

builder.Services.AddAuthorization();

// Password hasher
builder.Services.AddSingleton<IPasswordHasher<User>, PasswordHasher<User>>();
builder.Services.AddScoped<ITokenService, TokenService>();

// Seed Service
builder.Services.AddScoped<ISeedService>(sp =>
{
    var context = sp.GetRequiredService<IMongoContext>();
    var passwordHasher = sp.GetRequiredService<IPasswordHasher<User>>();
    return new PMInsight.Infrastructure.Seed.SeedService(context.Database, passwordHasher);
});

// Health Checks
builder.Services.AddSingleton<MongoHealthCheck>(sp =>
    new MongoHealthCheck(mongoConnection, mongoDatabase));
builder.Services.AddHealthChecks()
    .AddCheck<MongoHealthCheck>("MongoDB");

// Rate Limiting
builder.Services.AddRateLimiter(options =>
{
    options.AddFixedWindowLimiter("fixed", opt =>
    {
        opt.Window = TimeSpan.FromMinutes(1);
        opt.PermitLimit = 100;
        opt.QueueLimit = 0;
    });
});

// Swagger/OpenAPI
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo { Title = "PM Insight API", Version = "v1" });
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "JWT Authorization header using the Bearer scheme."
    });
    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// MediatR & Validation
builder.Services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(typeof(TokenService).Assembly));
builder.Services.AddValidatorsFromAssembly(typeof(TokenService).Assembly);

// Controllers
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    });

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors();
app.UseRateLimiter();
app.UseAuthentication();
app.UseTenantContext(); // Must be after UseAuthentication
app.UseAuthorization();

app.MapControllers();
app.MapHealthChecks("/health");

// Configure startup tasks
if (app.Environment.IsDevelopment())
{
    await StartupTasks.ConfigureMongoIndexesAsync(app.Services);
    
    // Run seed data
    using (var scope = app.Services.CreateScope())
    {
        var seedService = scope.ServiceProvider.GetRequiredService<ISeedService>();
        await seedService.SeedAsync();
    }
}

app.Run();
