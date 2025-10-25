# PMInsight Implementation Guide

This document provides step-by-step instructions to complete the PMInsight system implementation.

---

## 📋 Implementation Status

### ✅ Completed
- [x] Monorepo structure (pnpm workspace)
- [x] Shared TypeScript types with Zod schemas
- [x] .NET Backend project structure (Clean Architecture)
- [x] Domain entities & enums
- [x] MongoDB repositories with tenant isolation
- [x] React frontend structure with Vite
- [x] i18n setup (vi-VN, en-US)
- [x] Basic routing structure

### 🔄 In Progress / To Do
- [x] Authentication & Authorization (JWT, 2FA, OAuth)
- [ ] API Controllers for all modules
- [ ] React UI components (shadcn/ui)
- [ ] Pages & Features implementation
- [ ] Background jobs (Hangfire)
- [ ] File storage (R2)
- [ ] Seed data & templates
- [ ] Tests & CI/CD

---

## 🛠️ Next Steps

### Phase 1: Core Authentication (Week 1)

#### Backend Tasks

1. **JWT Token Service** (`PMInsight.Application/Services/TokenService.cs`):
```csharp
public interface ITokenService
{
    string GenerateAccessToken(User user);
    string GenerateRefreshToken();
    ClaimsPrincipal? ValidateToken(string token);
}
```

2. **Auth Commands & Queries** (`PMInsight.Application/Auth/`):
- `RegisterCommand.cs` & `RegisterCommandHandler.cs`
- `LoginCommand.cs` & `LoginCommandHandler.cs`
- `RefreshTokenCommand.cs`
- `Enable2FACommand.cs`
- `Verify2FACommand.cs`

3. **Auth Controller** (`PMInsight.Api/Controllers/AuthController.cs`):
```csharp
[ApiController]
[Route("api/v1/auth")]
public class AuthController : ControllerBase
{
    [HttpPost("register")]
    [HttpPost("login")]
    [HttpPost("refresh")]
    [HttpPost("2fa/setup")]
    [HttpPost("2fa/verify")]
}
```

4. **Password Hashing** (use ASP.NET Core Identity's `PasswordHasher<User>`):
```csharp
var hasher = new PasswordHasher<User>();
var hash = hasher.HashPassword(user, password);
var result = hasher.VerifyHashedPassword(user, hash, password);
```

5. **2FA with TOTP** (use `OtpNet` package):
```csharp
var secret = Base32Encoding.ToBytes(user.TwoFactorSecret);
var totp = new Totp(secret);
var isValid = totp.VerifyTotp(code, out _, new VerificationWindow(2, 2));
```

#### Frontend Tasks

1. **Auth Context** (`apps/web/src/lib/context/AuthContext.tsx`):
```typescript
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Login, logout, refresh logic
};
```

2. **Login Page** (`apps/web/src/pages/auth/LoginPage.tsx`):
- Form with React Hook Form + Zod validation
- 2FA code input (conditional)
- Error handling
- Redirect after login

3. **Register Page** (`apps/web/src/pages/auth/RegisterPage.tsx`):
- Multi-step: Email/Pass → Name/Org → Confirm
- Terms acceptance

4. **API Client** (`apps/web/src/lib/api/client.ts`):
```typescript
import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api/v1',
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Handle 401, refresh token logic
  }
);
```

---

### Phase 2: Core Modules Backend (Week 2-3)

#### Projects Module

1. **Commands**:
- `CreateProjectCommand` (with validation)
- `UpdateProjectCommand`
- `SetBaselineCommand`

2. **Queries**:
- `GetProjectsQuery` (with pagination, filters)
- `GetProjectByIdQuery`

3. **Controller** (`ProjectsController.cs`):
```csharp
[HttpGet]
public async Task<ActionResult<PaginatedResponse<ProjectDto>>> GetProjects(
    [FromQuery] string? status,
    [FromQuery] int limit = 20,
    [FromQuery] string? cursor = null
)

[HttpPost]
public async Task<ActionResult<ProjectDto>> CreateProject(CreateProjectDto dto)

[HttpPost("{id}/baseline")]
public async Task<ActionResult> SetBaseline(string id)
```

4. **Repository** (`ProjectRepository.cs`):
- Extend `TenantRepository<Project>`
- Add custom methods like `GetByCodeAsync`, `GetActiveProjectsAsync`

#### Similar Pattern for:
- **Stakeholders**: CRUD + influence/interest matrix
- **WBS**: Tree operations, lock/unlock, baseline
- **Tasks**: CRUD + dependencies, progress updates
- **Risks**: CRUD + scoring logic, heatmap data
- **Issues**: CRUD + priority filters
- **Changes**: Submit → Analyze → Decide workflow
- **Budgets**: CRUD + EVM calculations
- **Timesheets**: Submit → Approve workflow

---

### Phase 3: Frontend Components & Pages (Week 3-4)

#### UI Component Library (shadcn/ui)

1. **Install shadcn/ui**:
```bash
cd apps/web
npx shadcn-ui@latest init
```

2. **Add components**:
```bash
npx shadcn-ui@latest add button card dialog form input label select table tabs tooltip
```

3. **Create custom components**:
- `apps/web/src/components/ui/` (Button, Card, Dialog, etc.)
- `apps/web/src/components/layout/AppLayout.tsx` (Sidebar, Header, Footer)
- `apps/web/src/components/layout/Sidebar.tsx` (Navigation with icons)
- `apps/web/src/components/pmi/PMITooltip.tsx` (Learner-friendly explanations)
- `apps/web/src/components/pmi/EmptyState.tsx` (With examples & CTAs)

#### Dashboard Page

1. **KPI Cards** (`components/dashboard/KPICard.tsx`):
```tsx
<Card>
  <CardHeader>
    <CardTitle>Active Projects</CardTitle>
    <PMITooltip content="Projects currently in progress..." />
  </CardHeader>
  <CardContent>
    <div className="text-3xl font-bold">{count}</div>
  </CardContent>
</Card>
```

2. **Quick Actions** (`components/dashboard/QuickActions.tsx`):
- "New Project" button
- "Log Risk" button
- "Add Issue" button
- Each opens a dialog/wizard

3. **Recent Activity Feed** (`components/dashboard/ActivityFeed.tsx`):
- Fetch from `/api/v1/activities`
- Display timeline with user avatars

#### Projects Module

1. **Projects List** (`pages/projects/ProjectsPage.tsx`):
- Table with filters (status, owner, date range)
- Search bar
- "Create New" button

2. **Create Project Wizard** (`pages/projects/CreateProjectWizard.tsx`):
```tsx
const steps = [
  { id: 1, name: 'Charter', component: CharterStep },
  { id: 2, name: 'Stakeholders', component: StakeholdersStep },
  { id: 3, name: 'Scope & WBS', component: ScopeStep },
  { id: 4, name: 'Schedule', component: ScheduleStep },
  { id: 5, name: 'Budget', component: BudgetStep },
  { id: 6, name: 'Risks', component: RisksStep },
  { id: 7, name: 'Communications', component: CommsStep },
];
```

3. **Project Detail** (`pages/projects/ProjectDetailPage.tsx`):
- Tabs: Overview, Stakeholders, WBS, Schedule, Budget, Risks, Issues, Changes, etc.
- Each tab lazy-loads its content

#### Risk Matrix Component (`components/risks/RiskMatrix.tsx`):
```tsx
// 5x5 heatmap with Recharts
<ResponsiveContainer width="100%" height={400}>
  <ScatterChart>
    <CartesianGrid />
    <XAxis dataKey="probability" domain={[1, 5]} />
    <YAxis dataKey="impact" domain={[1, 5]} />
    <Scatter data={risks} fill="#8884d8" />
    <Tooltip content={<CustomTooltip />} />
  </ScatterChart>
</ResponsiveContainer>
```

#### Gantt Chart Component (`components/schedule/GanttChart.tsx`):
- Use `recharts` BarChart with custom bars
- Or integrate a lightweight Gantt library (e.g., `frappe-gantt-react`)
- Display tasks with dependencies

---

### Phase 4: Advanced Features (Week 5-6)

#### Background Jobs (Hangfire)

1. **Setup** (`PMInsight.Infrastructure/Jobs/HangfireConfiguration.cs`):
```csharp
services.AddHangfire(config =>
{
    config.UseMongoStorage(mongoConnection, mongoDatabase, new MongoStorageOptions
    {
        MigrationOptions = new MongoMigrationOptions
        {
            Strategy = MongoMigrationStrategy.Drop,
            BackupStrategy = MongoBackupStrategy.Collections
        }
    });
});

services.AddHangfireServer();
```

2. **Jobs**:
- `SendWeeklyReportJob.cs`: Email status reports every Monday
- `CalculateEVMJob.cs`: Recalculate CPI/SPI nightly
- `BackupDatabaseJob.cs`: Dump to R2 weekly
- `CleanupActivitiesJob.cs`: Delete old logs (90+ days)

3. **Dashboard**:
```csharp
app.MapHangfireDashboard("/hangfire", new DashboardOptions
{
    Authorization = new[] { new HangfireAuthorizationFilter() }
});
```

#### File Storage (Cloudflare R2)

1. **Storage Service** (`PMInsight.Infrastructure/Storage/R2StorageService.cs`):
```csharp
public interface IStorageService
{
    Task<string> GeneratePresignedUploadUrlAsync(string fileName);
    Task<string> GeneratePresignedDownloadUrlAsync(string key);
    Task<bool> DeleteFileAsync(string key);
}
```

2. **Controller** (`FilesController.cs`):
```csharp
[HttpPost("sign-upload")]
public async Task<ActionResult<SignedUploadResponse>> SignUpload(SignUploadRequest request)
{
    var key = $"{organizationId}/{Ulid.NewUlid()}/{request.FileName}";
    var url = await _storageService.GeneratePresignedUploadUrlAsync(key);
    return Ok(new { key, url, expiresIn = 3600 });
}
```

3. **Frontend Upload** (`components/files/FileUpload.tsx`):
```tsx
const uploadFile = async (file: File) => {
  // 1. Get signed URL from backend
  const { key, url } = await api.post('/files/sign-upload', { fileName: file.name });
  
  // 2. Upload directly to R2
  await axios.put(url, file, { headers: { 'Content-Type': file.type } });
  
  // 3. Save metadata to backend
  await api.post('/files', { key, name: file.name, size: file.size, mimeType: file.type });
};
```

#### Email Service (SendGrid)

1. **Email Service** (`PMInsight.Infrastructure/Email/SendGridEmailService.cs`):
```csharp
public interface IEmailService
{
    Task SendWelcomeEmailAsync(string to, string name);
    Task SendPasswordResetEmailAsync(string to, string resetLink);
    Task SendChangeRequestNotificationAsync(string to, ChangeRequest change);
    Task SendWeeklyReportAsync(string to, WeeklyReportData data);
}
```

2. **Templates** (use SendGrid dynamic templates):
- Welcome email
- Password reset
- Change request notification
- Weekly status report

#### SignalR Realtime

1. **Hub** (`PMInsight.Api/Hubs/NotificationHub.cs`):
```csharp
public class NotificationHub : Hub
{
    public async Task JoinProjectGroup(string projectId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"project:{projectId}");
    }
    
    public async Task NotifyProjectUpdate(string projectId, string message)
    {
        await Clients.Group($"project:{projectId}").SendAsync("ProjectUpdated", message);
    }
}
```

2. **Frontend Connection** (`lib/signalr/connection.ts`):
```typescript
import * as signalR from '@microsoft/signalr';

const connection = new signalR.HubConnectionBuilder()
  .withUrl('/hubs/notifications', {
    accessTokenFactory: () => localStorage.getItem('accessToken')!,
  })
  .withAutomaticReconnect()
  .build();

connection.on('ProjectUpdated', (message) => {
  toast.info(message);
});
```

---

### Phase 5: Seed Data & Templates (Week 6)

#### Seed Service (`PMInsight.Infrastructure/Seed/SeedService.cs`)

```csharp
public class SeedService
{
    public async Task SeedAsync()
    {
        // 1. Create roles
        await CreateRoles();
        
        // 2. Create sample organization
        var org = await CreateOrganization("Acme Corp", "acme");
        
        // 3. Create admin user
        var admin = await CreateUser(org.Id, "admin@acme.com", "Admin123!", "Admin User", new[] { UserRole.Admin });
        
        // 4. Create project templates
        await CreateProjectTemplate("IT Project", "it-project", org.Id);
        await CreateProjectTemplate("Event Project", "event-project", org.Id);
        
        // 5. Create sample project with full artifacts
        await CreateSampleProject(org.Id, admin.Id);
    }
}
```

#### Template JSON Files (`PMInsight.Infrastructure/Seed/Templates/`)

1. **it-project-template.json**:
```json
{
  "name": "IT Project Template",
  "description": "Template for software development projects",
  "wbs": [
    { "name": "1. Project Management", "children": [...] },
    { "name": "2. Requirements", "children": [...] },
    { "name": "3. Design", "children": [...] },
    { "name": "4. Development", "children": [...] },
    { "name": "5. Testing", "children": [...] },
    { "name": "6. Deployment", "children": [...] }
  ],
  "risks": [
    { "title": "Scope creep", "probability": "medium", "impact": "high", "strategy": "mitigate" }
  ]
}
```

---

### Phase 6: Testing & CI/CD (Week 7)

#### Backend Tests

1. **Unit Tests** (`PMInsight.Tests.Unit/`):
```csharp
public class RiskScoringTests
{
    [Fact]
    public void Risk_Score_Calculated_Correctly()
    {
        var risk = new Risk
        {
            Probability = RiskProbability.High, // 4
            Impact = RiskImpact.VeryHigh // 5
        };
        
        Assert.Equal(20, risk.Score);
    }
}
```

2. **Integration Tests** (`PMInsight.Tests.Integration/`):
```csharp
public class ProjectsApiTests : IClassFixture<WebApplicationFactory<Program>>
{
    [Fact]
    public async Task Create_Project_Returns_201()
    {
        var response = await _client.PostAsJsonAsync("/api/v1/projects", new CreateProjectDto(...));
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
    }
}
```

#### Frontend Tests

1. **Component Tests** (`apps/web/src/__tests__/`):
```typescript
import { render, screen } from '@testing-library/react';
import { ProjectCard } from '@/components/projects/ProjectCard';

test('renders project name', () => {
  render(<ProjectCard project={mockProject} />);
  expect(screen.getByText('Sample Project')).toBeInTheDocument();
});
```

2. **E2E Tests** (`apps/web/e2e/`):
```typescript
import { test, expect } from '@playwright/test';

test('create project workflow', async ({ page }) => {
  await page.goto('/auth/login');
  await page.fill('[name="email"]', 'admin@acme.com');
  await page.fill('[name="password"]', 'Admin123!');
  await page.click('button[type="submit"]');
  
  await page.goto('/projects/new');
  await page.fill('[name="name"]', 'Test Project');
  await page.fill('[name="code"]', 'TEST-001');
  await page.click('button:has-text("Next")');
  
  // Continue through wizard...
  
  await expect(page.locator('text=Project created successfully')).toBeVisible();
});
```

#### CI/CD Workflows

1. **`.github/workflows/ci.yml`**:
```yaml
name: CI
on: [push, pull_request]
jobs:
  backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-dotnet@v3
        with:
          dotnet-version: '8.0.x'
      - run: dotnet restore
      - run: dotnet build --no-restore
      - run: dotnet test --no-build --verbosity normal
  
  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter web lint
      - run: pnpm --filter web test
      - run: pnpm --filter web build
```

2. **`.github/workflows/deploy-frontend.yml`** (Vercel):
```yaml
name: Deploy Frontend
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: vercel deploy --prod --token=${{ secrets.VERCEL_TOKEN }}
```

---

## 🎨 UI/UX Guidelines (PMI Learner-First)

### 1. PMI Tooltips

Every PMI term should have a tooltip:

```tsx
<PMITooltip 
  term="WBS"
  definition="Work Breakdown Structure - Cấu trúc phân tích công việc"
  explanation="Phân chia dự án thành các phần nhỏ hơn, dễ quản lý. Ví dụ: Dự án xây nhà → Móng → Tường → Mái."
  learnMoreUrl="/learn/wbs"
/>
```

### 2. Empty States

```tsx
<EmptyState
  icon={FolderOpen}
  title="Chưa có rủi ro nào"
  description="Rủi ro là những sự kiện không chắc chắn có thể ảnh hưởng đến dự án."
  examples={[
    { title: "Dự án IT", risk: "Developer rời team giữa dự án" },
    { title: "Dự án Event", risk: "Thời tiết xấu ngày tổ chức" }
  ]}
  actions={[
    <Button onClick={() => openDialog()}>Thêm rủi ro đầu tiên</Button>
  ]}
/>
```

### 3. Wizards with Progress

```tsx
<WizardProgress steps={steps} currentStep={currentStep} />
<WizardStep>
  <StepTitle>Bước 1: Charter</StepTitle>
  <StepHelp>
    Charter là tài liệu khởi động dự án, xác định mục tiêu và người chịu trách nhiệm.
  </StepHelp>
  <Form>...</Form>
</WizardStep>
```

### 4. Weekly Practice Reminders

```tsx
<Card className="border-blue-500 bg-blue-50">
  <CardHeader>
    <CardTitle>📚 Thực hành tuần này</CardTitle>
  </CardHeader>
  <CardContent>
    <ul>
      <li>✅ Cập nhật tiến độ task (% hoàn thành)</li>
      <li>⚠️ Rà soát lại rủi ro đang mở (5 rủi ro)</li>
      <li>📊 Xem báo cáo EVM (CPI hiện tại: 0.95)</li>
    </ul>
  </CardContent>
</Card>
```

---

## 📦 Deployment Checklist

### Pre-Production

- [ ] All environment variables configured
- [ ] MongoDB indexes created
- [ ] Seed data run successfully
- [ ] All tests passing (unit + integration + e2e)
- [ ] Lighthouse score ≥ 90
- [ ] Security audit (OWASP checklist)
- [ ] Load testing (simulate 100 concurrent users)
- [ ] Backup strategy configured
- [ ] Error tracking configured (Sentry/AppInsights)

### Production

- [ ] DNS configured
- [ ] SSL certificates installed
- [ ] CORS origins whitelisted
- [ ] Rate limiting enabled
- [ ] 2FA enforced for admins
- [ ] Monitoring dashboards live (Grafana/AppInsights)
- [ ] On-call rotation scheduled
- [ ] Documentation published
- [ ] User onboarding flow tested
- [ ] Legal: Privacy policy + Terms of service

---

## 📚 Resources

### PMI Learning
- [PMBOK Guide](https://www.pmi.org/pmbok-guide-standards)
- [PMI Glossary](https://www.pmi.org/learning/library/glossary)

### Technical Docs
- [ASP.NET Core](https://learn.microsoft.com/en-us/aspnet/core)
- [MongoDB .NET Driver](https://www.mongodb.com/docs/drivers/csharp/)
- [React Query](https://tanstack.com/query/latest/docs/react/overview)
- [shadcn/ui](https://ui.shadcn.com/)

### Tools
- [Postman Collections](./docs/postman/) (for API testing)
- [Figma Designs](./docs/figma/) (UI mockups)

---

## 🆘 Troubleshooting

### MongoDB Connection Issues
```bash
# Test connection
mongosh "mongodb://localhost:27017"

# Check if service running
sudo systemctl status mongod
```

### .NET Build Errors
```bash
# Clear NuGet cache
dotnet nuget locals all --clear

# Restore packages
dotnet restore
```

### React Build Errors
```bash
# Clear node_modules
rm -rf node_modules .pnpm-store
pnpm install

# Check for type errors
pnpm --filter web type-check
```

---

**Next Action**: Start with Phase 1 (Authentication) and work through each phase systematically. Each phase should take approximately 1 week with a full-time developer.

Good luck! 🚀
