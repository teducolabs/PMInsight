# PMInsight Quick Start Guide

Get PMInsight running locally in under 10 minutes!

## Prerequisites

Ensure you have installed:

- ✅ **Node.js 20+** - [Download](https://nodejs.org/)
- ✅ **pnpm 8+** - Install: `npm install -g pnpm`
- ✅ **.NET 8 SDK** - [Download](https://dotnet.microsoft.com/download/dotnet/8.0)
- ✅ **MongoDB 7.0+** - [Install locally](https://www.mongodb.com/try/download/community) or use [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)

Optional:
- **Redis** (for caching) - [Download](https://redis.io/download)
- **VS Code** with extensions: C# Dev Kit, ESLint, Prettier

---

## Step 1: Clone & Install

```powershell
# Clone repository
git clone https://github.com/yourusername/pminsight.git
cd PMInsight

# Install dependencies (this may take 2-3 minutes)
pnpm install
```

---

## Step 2: Configure Environment

```powershell
# Copy example environment file
Copy-Item .env.example -Destination .env

# Edit .env with your text editor
code .env
```

**Minimum required settings**:
```env
# MongoDB (use Atlas free tier or local instance)
MONGODB_CONNECTION_STRING=mongodb://localhost:27017
MONGODB_DATABASE_NAME=pminsight

# JWT Secret (generate a strong random string)
JWT_SECRET=your-super-secret-jwt-key-change-this-32chars-min

# API & Web URLs (keep defaults for local dev)
API_BASE_URL=https://localhost:7001
WEB_BASE_URL=http://localhost:5173
CORS_ORIGINS=http://localhost:5173
```

**Optional (can configure later)**:
- SendGrid API Key (for emails)
- Cloudflare R2 credentials (for file storage)
- Google OAuth credentials (for social login)

---

## Step 3: Setup Database

### Option A: Local MongoDB

```powershell
# Start MongoDB service (if not running)
net start MongoDB

# Or with Docker
docker run -d -p 27017:27017 --name pminsight-mongo mongo:7.0
```

### Option B: MongoDB Atlas (Free Tier)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Create free cluster
3. Add your IP to whitelist
4. Get connection string → Update `.env`

### Create Indexes

```powershell
cd apps/api
dotnet run --project PMInsight.Api -- --configure-indexes
```

You should see:
```
✓ MongoDB indexes configured successfully
```

---

## Step 4: Seed Sample Data

```powershell
# Still in apps/api directory
dotnet run --project PMInsight.Api -- seed
```

This creates:
- ✅ Admin user: `admin@pminsight.com` / `Admin123!`
- ✅ Sample organization: "Acme Corp"
- ✅ Roles (Owner, Admin, PM, Coordinator, etc.)
- ✅ Project templates (IT, Event, Construction)
- ✅ Sample project with artifacts

---

## Step 5: Run Development Servers

### Option A: Run Both (Recommended)

```powershell
# From root directory
pnpm dev
```

This starts:
- ✅ Backend API on https://localhost:7001
- ✅ Frontend on http://localhost:5173

### Option B: Run Separately

**Terminal 1 - Backend**:
```powershell
cd apps/api
dotnet watch run --project PMInsight.Api
```

**Terminal 2 - Frontend**:
```powershell
cd apps/web
pnpm dev
```

---

## Step 6: Login & Explore

1. **Open browser**: http://localhost:5173

2. **Login with seeded account**:
   - Email: `admin@pminsight.com`
   - Password: `Admin123!`

3. **Explore**:
   - 📊 Dashboard with KPIs
   - 📁 Create new project (try the wizard!)
   - ⚠️ Add risks
   - 🐛 Log issues
   - 📈 View Gantt schedule

---

## API Documentation (Swagger)

Once backend is running, visit:

👉 **https://localhost:7001/swagger**

You'll see all available endpoints with:
- Request/response schemas
- Try-it-out functionality
- Authentication setup

---

## Common Issues & Solutions

### Issue: "MongoDB connection failed"

**Solution**:
```powershell
# Check if MongoDB is running
Get-Service MongoDB

# If not, start it
net start MongoDB
```

### Issue: "Port 7001 already in use"

**Solution**:
```powershell
# Find process using port
Get-Process -Id (Get-NetTCPConnection -LocalPort 7001).OwningProcess

# Kill it or change port in launchSettings.json
```

### Issue: ".NET SDK not found"

**Solution**:
```powershell
# Verify installation
dotnet --version

# Should output: 8.0.x
# If not, download from https://dotnet.microsoft.com/download
```

### Issue: "pnpm command not found"

**Solution**:
```powershell
npm install -g pnpm
```

### Issue: "TypeScript errors in frontend"

**Solution**:
```powershell
cd apps/web
pnpm install
```

The packages aren't installed yet, so type errors are expected until you run `pnpm install`.

---

## Next Steps

### 1. Complete Authentication Implementation

Follow **IMPLEMENTATION.md** → Phase 1 to build:
- JWT token generation/validation
- Login/Register pages with forms
- 2FA setup

### 2. Build Dashboard

Create KPI cards, activity feed, quick actions.

### 3. Implement Project Wizard

Multi-step form for creating projects following PMI process groups.

### 4. Add More Modules

Risks, Issues, Changes, Budget, Timesheets, etc.

---

## Development Workflow

### Making Changes

```powershell
# Create feature branch
git checkout -b feature/my-awesome-feature

# Make changes, then:
pnpm lint
pnpm test

# Commit
git add .
git commit -m "feat: add awesome feature"

# Push & create PR
git push origin feature/my-awesome-feature
```

### Running Tests

```powershell
# Backend tests
cd apps/api
dotnet test

# Frontend tests
cd apps/web
pnpm test

# E2E tests (requires both servers running)
pnpm test:e2e
```

---

## Useful Commands

```powershell
# Root directory commands
pnpm dev              # Start both servers
pnpm build            # Build both projects
pnpm test             # Run all tests
pnpm lint             # Lint frontend
pnpm format           # Format code with Prettier
pnpm clean            # Clean all build artifacts

# Backend specific
cd apps/api
dotnet restore        # Restore NuGet packages
dotnet build          # Build
dotnet watch run      # Run with hot reload
dotnet test           # Run tests

# Frontend specific
cd apps/web
pnpm dev              # Start dev server
pnpm build            # Build for production
pnpm preview          # Preview production build
pnpm test             # Run Vitest tests
pnpm test:e2e         # Run Playwright tests
```

---

## Environment Variables Reference

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_CONNECTION_STRING` | MongoDB connection | `mongodb://localhost:27017` |
| `MONGODB_DATABASE_NAME` | Database name | `pminsight` |
| `JWT_SECRET` | Secret for JWT signing | Random 32+ char string |

### Optional (Features)

| Variable | Description | Default |
|----------|-------------|---------|
| `SENDGRID_API_KEY` | SendGrid API key for emails | - |
| `EMAIL_FROM_ADDRESS` | From email address | `noreply@pminsight.com` |
| `R2_ENDPOINT` | Cloudflare R2 endpoint | - |
| `R2_ACCESS_KEY_ID` | R2 access key | - |
| `R2_SECRET_ACCESS_KEY` | R2 secret key | - |
| `REDIS_CONNECTION_STRING` | Redis for caching | `localhost:6379` |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | - |
| `GOOGLE_CLIENT_SECRET` | Google OAuth secret | - |

### Optional (Observability)

| Variable | Description | Default |
|----------|-------------|---------|
| `OTLP_ENDPOINT` | OpenTelemetry endpoint | `http://localhost:4317` |
| `SEQ_SERVER_URL` | Seq server for logs | `http://localhost:5341` |

---

## Resources

- 📘 **Full Documentation**: [README.md](README.md)
- 🛠️ **Implementation Guide**: [IMPLEMENTATION.md](IMPLEMENTATION.md)
- 🐛 **Report Issues**: [GitHub Issues](https://github.com/yourusername/pminsight/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/yourusername/pminsight/discussions)

---

## Need Help?

1. Check [IMPLEMENTATION.md](IMPLEMENTATION.md) for detailed guidance
2. Search existing [GitHub Issues](https://github.com/yourusername/pminsight/issues)
3. Ask in [Discussions](https://github.com/yourusername/pminsight/discussions)
4. Email: support@pminsight.com

---

**Ready to build? Let's go! 🚀**

Start with Phase 1 in [IMPLEMENTATION.md](IMPLEMENTATION.md) to implement authentication and get the full system running.
