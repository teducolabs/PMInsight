# PMInsight - Production-Grade Project Management Practice System

<div align="center">

**A multi-tenant PM system aligned with PMI standards for learners and practitioners**

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![.NET](https://img.shields.io/badge/.NET-8.0-512BD4)](https://dotnet.microsoft.com/)
[![React](https://img.shields.io/badge/React-18-61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.0-47A248)](https://www.mongodb.com/)

</div>

---

## 🎯 Overview

PMInsight is a **learner-first**, production-grade project management system designed to help PMI beginners understand and practice project management through:

- **🎓 Guided Workflows**: Step-by-step wizards following PMI process groups (Initiating → Planning → Executing → Monitoring & Controlling → Closing)
- **📚 Educational UI**: Tooltips, examples, templates, and empty states that explain PMI concepts in simple language
- **🛠️ Practical Tools**: Ready-made templates, checklists, visual boards, Gantt charts, risk matrices, EVM dashboards
- **🏢 Multi-Tenant**: Soft isolation by organization with RBAC (Owner, Admin, PM, Coordinator, Team Member, Stakeholder, Finance, QA)
- **🌍 Accessible**: Mobile-first, A11y-compliant, i18n-ready (vi-VN default, en-US)

---

## 🏗️ Architecture

### Tech Stack

#### Frontend
- **Framework**: React 18 + TypeScript + Vite
- **UI**: TailwindCSS + shadcn/ui (Radix) + lucide-react
- **State**: TanStack Query (React Query)
- **Forms**: React Hook Form + Zod validation
- **Routing**: React Router v6
- **Charts**: Recharts
- **Rich Text**: TipTap
- **i18n**: i18next

#### Backend
- **Framework**: ASP.NET Core 8 (Clean Architecture)
- **Patterns**: MediatR (CQRS), FluentValidation, AutoMapper
- **Database**: MongoDB 7.0+ (multi-tenant with `organizationId`)
- **Auth**: ASP.NET Core Identity + JWT + Google OAuth + TOTP 2FA
- **Jobs**: Hangfire (MongoDB storage)
- **Email**: SendGrid
- **Storage**: Cloudflare R2 (S3-compatible)
- **Cache**: Redis (StackExchange.Redis)
- **Realtime**: SignalR
- **Observability**: Serilog + OpenTelemetry

#### Infrastructure
- **CI/CD**: GitHub Actions
- **Frontend Deploy**: Vercel / Cloudflare Pages / Netlify
- **Backend Deploy**: Azure App Service / Fly.io / Render
- **Database**: MongoDB Atlas

---

## 📁 Project Structure

```
PMInsight/
├── apps/
│   ├── api/                      # .NET Backend
│   │   ├── PMInsight.Api/        # API Controllers, Program.cs
│   │   ├── PMInsight.Application/ # CQRS Commands/Queries, DTOs
│   │   ├── PMInsight.Domain/     # Entities, Enums, Interfaces
│   │   └── PMInsight.Infrastructure/ # MongoDB, Email, Storage, Auth
│   └── web/                      # React Frontend
│       ├── src/
│       │   ├── components/       # Shared UI components
│       │   ├── features/         # Feature modules (projects, risks, etc.)
│       │   ├── pages/            # Page components
│       │   ├── lib/              # Utilities, API client, hooks
│       │   └── i18n/             # Translation files
│       └── public/
├── packages/
│   ├── config/                   # Shared configs (eslint, tailwind)
│   ├── types/                    # Shared TypeScript/Zod types
│   └── ui/                       # Shared UI component library
├── .github/
│   └── workflows/                # CI/CD pipelines
├── package.json                  # Root workspace config
├── pnpm-workspace.yaml
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 20+ and **pnpm** 8+
- **.NET 8 SDK**
- **MongoDB** 7.0+ (local or Atlas)
- **Redis** (optional, for caching)

### 1. Clone & Install

```bash
git clone https://github.com/yourusername/pminsight.git
cd PMInsight
pnpm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

**Critical settings**:
```env
MONGODB_CONNECTION_STRING=mongodb://localhost:27017
MONGODB_DATABASE_NAME=pminsight
JWT_SECRET=your-super-secret-32-char-minimum-key
SENDGRID_API_KEY=your-sendgrid-key
R2_ENDPOINT=https://your-account.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your-key
R2_SECRET_ACCESS_KEY=your-secret
```

### 3. Configure MongoDB Indexes

```bash
cd apps/api
dotnet run --project PMInsight.Api -- --configure-indexes
```

### 4. Seed Sample Data

```bash
dotnet run --project PMInsight.Api -- seed
```

This creates:
- Sample organization
- Admin user (admin@pminsight.com / Admin123!)
- Roles (Owner, Admin, PM, Coordinator, etc.)
- Project templates (IT, Event, Construction)
- Sample project with full artifacts

### 5. Run Development Servers

**Option A: Run both (from root)**
```bash
pnpm dev
```

**Option B: Run separately**
```bash
# Terminal 1 - Backend
cd apps/api
dotnet watch run --project PMInsight.Api

# Terminal 2 - Frontend
cd apps/web
pnpm dev
```

**Access**:
- Frontend: http://localhost:5173
- Backend API: https://localhost:7001
- Swagger: https://localhost:7001/swagger

---

## 🎓 PMI Process Groups & Modules

PMInsight follows the **PMI PMBOK** process groups:

### 1️⃣ **Initiating**
- **Project Charter**: Purpose, objectives, success criteria, high-level scope
- **Stakeholder Identification**: Register with influence/interest matrix

### 2️⃣ **Planning**
- **Scope Management**: WBS (Work Breakdown Structure) with deliverables
- **Schedule Management**: Gantt chart, task dependencies, critical path
- **Cost Management**: Budget categories, baseline, EVM setup
- **Risk Management**: Risk register with P×I matrix, response strategies
- **Communications Management**: Comms plan, audience, channels
- **Resource Management**: Team allocation, roles, skills

### 3️⃣ **Executing**
- **Task Execution**: Updates, progress tracking, timesheets
- **Quality Assurance**: Audits, checklists
- **Communications**: Meeting minutes, status reports

### 4️⃣ **Monitoring & Controlling**
- **Issue Management**: Issue log with priority tracking
- **Change Control**: Change requests → impact analysis → CCB decision
- **Performance**: EVM (CPI/SPI), variance analysis
- **Risk Monitoring**: Residual risk tracking

### 5️⃣ **Closing**
- **Lessons Learned**: Capture by phase, searchable
- **Final Reports**: Executive summary, closure docs
- **Procurement Closure**: Vendor deliverables acceptance

---

## 🧩 Core Features

### 🎛️ Dashboard
- **KPIs**: Active projects, schedule variance (SV%), CPI, open risks, pending changes
- **Quick Actions**: New project, import template, log risk, add issue
- **Quick Stats**: Today / This week / This month / This quarter filters
- **Cards**: Tasks due, risks by severity, issues, budget burn

### 📊 Projects
- **List View**: Filters by status, owner, portfolio
- **Create Wizard** (5-7 steps):
  1. Charter & basic info
  2. Stakeholders & RACI
  3. Scope & WBS
  4. Schedule & milestones
  5. Budget & cost baseline
  6. Risk framework setup
  7. Communications plan
- **Project Overview**: One-page summary with baselines

### 📈 Schedule (Gantt)
- Task dependencies (FS, SS, FF, SF)
- Baseline save/compare
- Critical path highlight
- Progress tracking

### 💰 Budget & EVM
- Budget categories (planned vs. actual)
- **Earned Value Metrics**:
  - PV (Planned Value)
  - EV (Earned Value)
  - AC (Actual Cost)
  - CPI = EV / AC
  - SPI = EV / PV
- Cost variance charts

### ⚠️ Risk & Issue Management
- **Risk Register**: Probability × Impact scoring (1-5 scale)
- **Risk Heatmap**: Visual 5×5 matrix
- **Response Strategies**: Avoid, Transfer, Mitigate, Accept
- **Issue Log**: Priority, owner, due date, escalation links

### 🔄 Change Control
- **Workflow**: Submit → Analyze impact (scope/schedule/cost/quality/risk) → CCB Decision → Implement
- **Baseline Versioning**: Compare v1 vs. v2
- **Audit Trail**: Full history

### 📄 Reports
- **Presets**: Executive Status (RAG), Burnup/Burndown, EVM Dashboard
- **Custom Date Ranges**
- **Export**: PDF, Excel

### 🔐 Security & Multi-Tenancy
- **Soft Isolation**: All data scoped by `organizationId`
- **RBAC**: Server-side policies + client-side abilities (CASL-like)
- **2FA**: TOTP via authenticator app (org-enforced)
- **Audit Log**: Who/when/what for baselines, changes, approvals

---

## 🧪 Testing

```bash
# Backend tests
cd apps/api
dotnet test

# Frontend tests
cd apps/web
pnpm test

# E2E tests (Playwright)
pnpm test:e2e
```

**E2E Coverage**:
- Login → Create project wizard → Add WBS → Set baseline → Create tasks → Log risk → Raise change → Decide → Timesheets → Export report

---

## 🚢 Deployment

### Frontend (Vercel/Cloudflare/Netlify)

1. **Build**:
   ```bash
   cd apps/web
   pnpm build
   ```

2. **Deploy** (Vercel example):
   ```bash
   vercel --prod
   ```

### Backend (Azure/Fly.io/Render)

1. **Build Docker Image**:
   ```bash
   cd apps/api
   docker build -t pminsight-api:latest .
   ```

2. **Deploy to Azure App Service**:
   ```bash
   az webapp create --resource-group pminsight-rg --plan pminsight-plan --name pminsight-api --deployment-container-image-name pminsight-api:latest
   ```

### Database (MongoDB Atlas)

- Create cluster → Get connection string → Update env vars
- Configure IP whitelist
- Enable backups

### CI/CD (GitHub Actions)

See `.github/workflows/`:
- `ci.yml`: Lint, test on PR
- `deploy-frontend.yml`: Build & deploy frontend
- `deploy-backend.yml`: Build & deploy backend
- `seed.yml`: Run migrations & seed on demand

---

## 📚 API Documentation

**Swagger UI**: `https://localhost:7001/swagger`

### Key Endpoints

#### Auth
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/2fa/setup`
- `POST /api/v1/auth/2fa/verify`

#### Projects
- `GET /api/v1/projects`
- `POST /api/v1/projects`
- `POST /api/v1/projects/{id}/baseline`

#### Tasks
- `GET /api/v1/projects/{id}/tasks`
- `PUT /api/v1/tasks/{id}/progress`

#### Risks
- `GET /api/v1/projects/{id}/risks`
- `POST /api/v1/projects/{id}/risks`

#### Changes
- `POST /api/v1/projects/{id}/changes`
- `PUT /api/v1/changes/{id}/decide`

---

## 🌍 Internationalization (i18n)

**Default**: Vietnamese (vi-VN)  
**Supported**: English (en-US)

Add translations in `apps/web/src/i18n/`:

```typescript
// vi-VN.json
{
  "projects.create": "Tạo dự án mới",
  "risks.high": "Cao"
}

// en-US.json
{
  "projects.create": "Create new project",
  "risks.high": "High"
}
```

---

## 🧠 PMI Glossary (Mini)

| Term | Vietnamese | Explanation |
|------|-----------|-------------|
| **WBS** | Cấu trúc phân tích công việc | Hierarchical breakdown of project deliverables |
| **EVM** | Quản lý giá trị thu được | Technique to measure project performance (PV, EV, AC) |
| **CPI** | Chỉ số hiệu suất chi phí | Cost Performance Index = EV / AC (>1 = under budget) |
| **SPI** | Chỉ số hiệu suất tiến độ | Schedule Performance Index = EV / PV (>1 = ahead) |
| **Risk P×I** | Xác suất × Tác động | Probability (1-5) × Impact (1-5) = Risk Score (1-25) |
| **CCB** | Hội đồng kiểm soát thay đổi | Change Control Board - approves/rejects changes |
| **RACI** | Ma trận trách nhiệm | Responsible, Accountable, Consulted, Informed |

---

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit (`git commit -m 'Add amazing feature'`)
4. Push (`git push origin feature/amazing-feature`)
5. Open a Pull Request

**Guidelines**:
- Follow existing code style (prettier, eslint, .editorconfig)
- Add tests for new features
- Update documentation
- Keep commits atomic

---

## 📄 License

MIT License - see [LICENSE](LICENSE)

---

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/pminsight/issues)
- **Email**: support@pminsight.com
- **Docs**: [docs.pminsight.com](https://docs.pminsight.com)

---

## 🎉 Acknowledgments

- **PMI PMBOK® Guide** for project management standards
- **shadcn/ui** for beautiful React components
- **MongoDB** for flexible document storage
- **ASP.NET Core** team for excellent framework

---

**Built with ❤️ for PMI learners worldwide**
