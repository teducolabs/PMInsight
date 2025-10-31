# PMInsight Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Browser    │  │    Mobile    │  │  Desktop     │          │
│  │   (React)    │  │   (Future)   │  │  (Future)    │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                  │                  │                  │
│         └──────────────────┼──────────────────┘                  │
│                            │                                     │
└────────────────────────────┼─────────────────────────────────────┘
                             │
                             │ HTTPS / WSS
                             │
┌────────────────────────────┼─────────────────────────────────────┐
│                  API Gateway / Load Balancer                      │
│                    (Azure / Cloudflare)                           │
└────────────────────────────┼─────────────────────────────────────┘
                             │
┌────────────────────────────┼─────────────────────────────────────┐
│                     ASP.NET Core API                              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    API Layer                              │   │
│  │  Controllers │ Middlewares │ Filters │ SignalR Hubs      │   │
│  └──────────────┬───────────────────────────────────────────┘   │
│                 │                                                 │
│  ┌──────────────┴───────────────────────────────────────────┐   │
│  │                 Application Layer (MediatR)               │   │
│  │  Commands │ Queries │ Validators │ DTOs │ AutoMapper     │   │
│  └──────────────┬───────────────────────────────────────────┘   │
│                 │                                                 │
│  ┌──────────────┴───────────────────────────────────────────┐   │
│  │                    Domain Layer                           │   │
│  │  Entities │ Value Objects │ Domain Events │ Interfaces   │   │
│  └──────────────┬───────────────────────────────────────────┘   │
│                 │                                                 │
│  ┌──────────────┴───────────────────────────────────────────┐   │
│  │                Infrastructure Layer                       │   │
│  │  MongoDB │ Redis │ SendGrid │ R2 Storage │ Hangfire      │   │
│  └──────────────┬───────────────────────────────────────────┘   │
└─────────────────┼───────────────────────────────────────────────┘
                  │
                  │
┌─────────────────┼───────────────────────────────────────────────┐
│             External Services                                     │
│  ┌─────────────┼─────────────┐  ┌────────────────────────┐      │
│  │   MongoDB Atlas            │  │  Cloudflare R2         │      │
│  │  (Primary Database)        │  │  (File Storage)        │      │
│  └────────────────────────────┘  └────────────────────────┘      │
│  ┌────────────────────────────┐  ┌────────────────────────┐      │
│  │   Redis Cloud              │  │  SendGrid              │      │
│  │   (Cache & Sessions)       │  │  (Email Service)       │      │
│  └────────────────────────────┘  └────────────────────────┘      │
│  ┌────────────────────────────┐                                  │
│  │   OpenTelemetry Collector  │                                  │
│  │   (Observability)           │                                  │
│  └────────────────────────────┘                                  │
└──────────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. User Request Flow

```
User Action (UI) 
  → React Component 
  → API Client (Axios) 
  → Backend API Controller 
  → MediatR Handler 
  → Repository 
  → MongoDB
  ← Response propagates back
```

### 2. Authentication Flow

```
Login Request
  → AuthController.Login()
  → LoginCommandHandler
  → Validate credentials (PasswordHasher)
  → Generate JWT + RefreshToken
  → Store RefreshToken in DB
  → Return tokens to client
  → Client stores in localStorage
  → Subsequent requests include JWT in Authorization header
```

### 3. Multi-Tenant Isolation

```
Every request:
  → JWT decoded → Extract organizationId from claims
  → Middleware injects organizationId into context
  → Repository filters by organizationId automatically
  → Ensures tenant isolation
```

## Key Design Patterns

### CQRS (Command Query Responsibility Segregation)

- **Commands**: Mutate state (Create, Update, Delete)
- **Queries**: Read state (Get, List, Search)
- **MediatR**: Orchestrates command/query handling

Example:
```csharp
// Command
public record CreateProjectCommand(CreateProjectDto Dto) : IRequest<ProjectDto>;

// Handler
public class CreateProjectCommandHandler : IRequestHandler<CreateProjectCommand, ProjectDto>
{
    public async Task<ProjectDto> Handle(CreateProjectCommand request, CancellationToken ct)
    {
        // Validation → Business logic → Save to DB → Return DTO
    }
}

// Controller
[HttpPost]
public async Task<ActionResult<ProjectDto>> CreateProject(CreateProjectDto dto)
{
    var result = await _mediator.Send(new CreateProjectCommand(dto));
    return CreatedAtAction(nameof(GetProject), new { id = result.Id }, result);
}
```

### Repository Pattern

- Abstracts data access
- Provides consistent interface
- Supports unit testing (mocking)

```csharp
public interface IRepository<T>
{
    Task<T?> GetByIdAsync(string id);
    Task<List<T>> FindAsync(Expression<Func<T, bool>> predicate);
    Task<T> CreateAsync(T entity);
    Task<bool> UpdateAsync(string id, T entity);
    Task<bool> DeleteAsync(string id);
}
```

### Soft Delete

- Never physically delete data
- Set `DeletedAt` timestamp
- All queries filter by `DeletedAt == null`

### Audit Trail

- Every mutation logs to `activities` collection
- Captures: Who, What, When, Where (IP), Why (metadata)

## Security Layers

1. **Network**: HTTPS, CORS, CSP headers
2. **Authentication**: JWT tokens, refresh tokens, 2FA
3. **Authorization**: RBAC (roles + claims), tenant isolation
4. **Input Validation**: FluentValidation (backend), Zod (frontend)
5. **Rate Limiting**: Per-user/IP limits
6. **OWASP Top 10**: XSS, CSRF, SQL Injection (N/A - NoSQL), etc.

## Performance Optimizations

1. **Caching**: Redis for frequently accessed data (user profiles, settings)
2. **Database Indexes**: Multi-field indexes on organizationId + common filters
3. **Pagination**: Cursor-based pagination for large datasets
4. **Lazy Loading**: React lazy() for code splitting
5. **CDN**: Static assets served via CDN (Cloudflare/Vercel)
6. **Compression**: Gzip/Brotli for API responses

## Scalability

### Horizontal Scaling

- **API**: Stateless, scale via load balancer
- **MongoDB**: Sharding by organizationId
- **Redis**: Clustered for high availability

### Background Jobs (Hangfire)

- Offload heavy tasks (reports, emails, backups)
- Scheduled jobs (daily EVM calculation, weekly reports)
- Retry logic for transient failures

## Monitoring & Observability

- **Logs**: Serilog → Seq/ELK/Application Insights
- **Metrics**: OpenTelemetry → Prometheus/Grafana
- **Traces**: Distributed tracing for request flows
- **Health Checks**: `/health` endpoint for uptime monitoring
- **Alerts**: Critical errors, high latency, resource exhaustion

---

## Next Steps

Refer to **IMPLEMENTATION.md** for phase-by-phase development guidance.
