# PMInsight - Documentation Index

Welcome to PMInsight! This index helps you navigate all documentation.

---

## 🚀 Getting Started (Start Here!)

### For New Users
1. **[README.md](README.md)** - Project overview, features, tech stack
2. **[QUICKSTART.md](QUICKSTART.md)** - Get running in 10 minutes
3. **[PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)** - What's built, what's next

### For Developers
1. **[IMPLEMENTATION.md](IMPLEMENTATION.md)** - Phase-by-phase development guide (7 weeks)
2. **[ARCHITECTURE.md](ARCHITECTURE.md)** - System design, patterns, security
3. **[CONTRIBUTING.md](CONTRIBUTING.md)** - How to contribute

---

## 📚 Documentation Files

### Core Documentation

| File | Purpose | Audience | Time to Read |
|------|---------|----------|--------------|
| **[README.md](README.md)** | Project overview, features, tech stack | Everyone | 10 min |
| **[QUICKSTART.md](QUICKSTART.md)** | Step-by-step setup guide | Developers | 15 min |
| **[IMPLEMENTATION.md](IMPLEMENTATION.md)** | Detailed implementation guide | Developers | 45 min |
| **[ARCHITECTURE.md](ARCHITECTURE.md)** | System architecture & design | Architects | 20 min |
| **[PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)** | Current status & next steps | Everyone | 10 min |

### Contributing & Legal

| File | Purpose |
|------|---------|
| **[CONTRIBUTING.md](CONTRIBUTING.md)** | Contribution guidelines |
| **[LICENSE](LICENSE)** | MIT License |

### Configuration Files

| File | Purpose |
|------|---------|
| **.env.example** | Environment variables template |
| **docker-compose.yml** | Local development services (MongoDB, Redis) |
| **pnpm-workspace.yaml** | Monorepo workspace configuration |
| **.gitignore** | Git ignore patterns |
| **.editorconfig** | Editor configuration |
| **.prettierrc.json** | Code formatting rules |

---

## 🗂️ Project Structure

```
PMInsight/
│
├── 📄 Documentation (You are here!)
│   ├── README.md                    ← Start here
│   ├── QUICKSTART.md                ← Setup guide
│   ├── IMPLEMENTATION.md            ← Development guide
│   ├── ARCHITECTURE.md              ← System design
│   ├── PROJECT_SUMMARY.md           ← Current status
│   ├── CONTRIBUTING.md              ← How to contribute
│   └── LICENSE                      ← MIT License
│
├── ⚙️ Configuration
│   ├── .env.example                 ← Environment variables
│   ├── docker-compose.yml           ← Local services
│   ├── pnpm-workspace.yaml          ← Monorepo config
│   ├── .gitignore
│   ├── .editorconfig
│   └── .prettierrc.json
│
├── 🖥️ Backend (.NET 8)
│   └── apps/api/
│       ├── PMInsight.Api/           ← Controllers, Program.cs
│       ├── PMInsight.Application/   ← CQRS, DTOs
│       ├── PMInsight.Domain/        ← Entities, Enums
│       ├── PMInsight.Infrastructure/ ← MongoDB, Email, Storage
│       ├── PMInsight.sln
│       └── Dockerfile
│
├── 🌐 Frontend (React 18)
│   └── apps/web/
│       ├── src/
│       │   ├── components/          ← UI components
│       │   ├── pages/               ← Page components
│       │   ├── lib/                 ← Utilities, API client
│       │   └── i18n/                ← Translations (vi-VN, en-US)
│       ├── package.json
│       ├── vite.config.ts
│       └── tailwind.config.js
│
├── 📦 Shared Packages
│   ├── packages/types/              ← Shared Zod schemas
│   └── packages/config/             ← Shared configs
│
└── 🤖 CI/CD
    └── .github/workflows/
        ├── ci.yml                   ← Build & test on PR
        ├── deploy-frontend.yml      ← Deploy to Vercel
        └── deploy-backend.yml       ← Deploy to Azure
```

---

## 🎯 Quick Navigation by Task

### "I want to..."

#### Set up the project locally
→ **[QUICKSTART.md](QUICKSTART.md)** - Follow steps 1-6

#### Understand the system architecture
→ **[ARCHITECTURE.md](ARCHITECTURE.md)** - Read data flow, design patterns

#### Start implementing features
→ **[IMPLEMENTATION.md](IMPLEMENTATION.md)** - Start with Phase 1 (Authentication)

#### Contribute code
→ **[CONTRIBUTING.md](CONTRIBUTING.md)** - Read guidelines, fork, submit PR

#### Deploy to production
→ **[README.md](README.md)** (Deployment section) + **[IMPLEMENTATION.md](IMPLEMENTATION.md)** (Phase 6)

#### Understand what's built vs. what's pending
→ **[PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)** - See checklist

#### Learn about tech decisions
→ **[ARCHITECTURE.md](ARCHITECTURE.md)** - See "Tech Decisions Explained"

#### Add a new module (e.g., Quality Management)
→ **[IMPLEMENTATION.md](IMPLEMENTATION.md)** - Follow Phase 2 pattern

---

## 📖 Learning Path

### For PMI Beginners (Non-Technical)
1. Read **[README.md](README.md)** - Understand PMI alignment
2. Browse UI mockups (when available)
3. Try the running app (after setup)

### For Developers (Backend Focus)
1. **[QUICKSTART.md](QUICKSTART.md)** - Setup environment
2. **[ARCHITECTURE.md](ARCHITECTURE.md)** - Understand .NET structure
3. **[IMPLEMENTATION.md](IMPLEMENTATION.md)** - Phase 1 (Auth) → Phase 2 (APIs)

### For Developers (Frontend Focus)
1. **[QUICKSTART.md](QUICKSTART.md)** - Setup environment
2. **[IMPLEMENTATION.md](IMPLEMENTATION.md)** - Phase 3 (UI components & pages)
3. Explore `apps/web/src/` structure

### For Architects / Tech Leads
1. **[README.md](README.md)** - Features & tech stack
2. **[ARCHITECTURE.md](ARCHITECTURE.md)** - System design
3. **[IMPLEMENTATION.md](IMPLEMENTATION.md)** - Review phase plan
4. **[PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)** - Current status

---

## 🛠️ Technical Documentation by Topic

### Authentication & Security
- **[IMPLEMENTATION.md](IMPLEMENTATION.md)** → Phase 1
- **[ARCHITECTURE.md](ARCHITECTURE.md)** → Security Layers

### Database & Data Access
- **[ARCHITECTURE.md](ARCHITECTURE.md)** → Repository Pattern
- **Backend Code**: `apps/api/PMInsight.Infrastructure/Persistence/`

### API Design
- **[README.md](README.md)** → API Design section
- **Swagger Docs**: https://localhost:7001/swagger (when running)

### Frontend Architecture
- **[IMPLEMENTATION.md](IMPLEMENTATION.md)** → Phase 3
- **Frontend Code**: `apps/web/src/`

### DevOps & Deployment
- **[QUICKSTART.md](QUICKSTART.md)** → Step 3 (Docker)
- **CI/CD Workflows**: `.github/workflows/`

### Testing
- **[IMPLEMENTATION.md](IMPLEMENTATION.md)** → Phase 6
- **[CONTRIBUTING.md](CONTRIBUTING.md)** → Testing guidelines

---

## 🔗 External Resources

### PMI Learning
- [PMBOK Guide](https://www.pmi.org/pmbok-guide-standards)
- [PMI Glossary](https://www.pmi.org/learning/library/glossary)

### Technical Documentation
- [ASP.NET Core Docs](https://learn.microsoft.com/en-us/aspnet/core)
- [MongoDB .NET Driver](https://www.mongodb.com/docs/drivers/csharp/)
- [React Query Docs](https://tanstack.com/query/latest/docs/react/overview)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

## 🆘 Getting Help

### In this repo
1. Check **[QUICKSTART.md](QUICKSTART.md)** troubleshooting section
2. Search [GitHub Issues](https://github.com/yourusername/pminsight/issues)
3. Open a new issue or discussion

### Community
- **GitHub Discussions**: For questions, ideas, showcase
- **GitHub Issues**: For bugs, feature requests

### Contact
- **Email**: support@pminsight.com
- **Website**: [pminsight.com](https://pminsight.com) (when live)

---

## 📝 Contributing to Documentation

Found an error or want to improve docs?

1. Fork the repo
2. Edit the relevant `.md` file
3. Submit a PR with description

All documentation is written in **Markdown** and lives in the root directory.

---

## 🎉 Ready to Start?

### If you're new:
👉 **[QUICKSTART.md](QUICKSTART.md)** - Get running in 10 minutes

### If you want to build:
👉 **[IMPLEMENTATION.md](IMPLEMENTATION.md)** - Phase-by-phase guide

### If you want to understand:
👉 **[ARCHITECTURE.md](ARCHITECTURE.md)** - System design

---

**Happy building! 🚀**
