# eSushrut G5 - QR Code Patient Feedback & Grievance Redressal System

![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)
![Coverage](https://img.shields.io/badge/coverage-%3E80%25-success.svg)
![Security](https://img.shields.io/badge/OWASP%20ZAP-Compliant-blue.svg)
![License](https://img.shields.io/badge/license-Open--Source%20(MIT)-green.svg)
![eSushrut G5](https://img.shields.io/badge/C--DAC-eSushrut%20G5%20HMIS-blue)

Official, production-grade **QR Code Patient Feedback & Grievance Redressal System** module engineered for **eSushrut G5** (Hospital Management & Information System developed by **Centre for Development of Advanced Computing - C-DAC**).

Built using **100% free and open-source software**, enterprise design patterns, cryptographic QR authentication, multi-tier automated SLA escalation, and full automated testing.

---

## 1. System Architecture & Monorepo Structure

The project is structured as an npm workspaces monorepo:

```
esushrut-feedback/
├── apps/
│   ├── web/                    # React 18 + TypeScript + Vite Frontend (eSushrut G5 Theme)
│   │   ├── src/
│   │   │   ├── api/            # Axios HTTP client with JWT interceptor & auto-refresh
│   │   │   ├── components/     # AppHeader, MainNav, SubMenuBar, MenuCard, MenuRow, AppFooter,
│   │   │   │                   # DataTable, StarRating, EmojiScale, NpsScale, StatusBadge
│   │   │   ├── context/        # AuthContext (Role guards, tokens, user session)
│   │   │   ├── i18n/           # react-i18next locales: English, Telugu (తెలుగు), Hindi (हिंदी)
│   │   │   ├── pages/
│   │   │   │   ├── admin/      # Dashboard, QR Generator, Bulk Print, Feedbacks, Complaints, Masters, Reports, Login
│   │   │   │   └── public/     # MobileFeedbackPage (Citizen Wizard), TrackStatusPage
│   │   │   └── styles/         # esushrut-theme.css (CSS Variables matching eSushrut G5)
│   │   └── Dockerfile          # Multi-stage production build with Nginx
│   └── api/                    # NestJS 10 + TypeScript + Prisma ORM Backend
│       ├── prisma/             # schema.prisma, seed.ts, migrations, raw SQL constraints
│       ├── src/
│       │   ├── common/         # GlobalExceptionFilter, JwtAuthGuard, RolesGuard, FileValidator, Pino
│       │   └── modules/        # auth, users, hospitals, departments, qr, feedback, complaints,
│       │                       # questions, categories, escalation, reports, notifications, audit
│       ├── test/               # Jest Unit & Supertest Integration tests against PostgreSQL
│       └── Dockerfile          # Multi-stage Alpine container runner
├── packages/
│   └── shared/                 # Shared TypeScript types, Zod schemas, HMAC & masking utils
├── docs/                       # Comprehensive documentation & screenshots
│   ├── MANUAL_TEST_CASES.md    # 75 comprehensive test cases (Positive, Negative, Boundary)
│   └── screenshots/            # Verified captures of Admin, Standees, Mobile Form, Reports
├── e2e/                        # Playwright E2E suites (Telugu flow, Complaint lifecycle, Bulk PDF, Axe)
├── load-tests/                 # k6 performance script (500 concurrent users, p95 < 2s target)
├── security/                   # OWASP ZAP baseline scan config & automated scanner
├── nginx/                      # Production Gateway configuration
├── docker-compose.yml          # Container orchestration (web, api, postgres, nginx)
└── package.json                # Root monorepo workspace configuration
```

---

## 2. Technology Stack

### Frontend (`/apps/web`)
- **React 18** + **TypeScript** + **Vite 5** (Fast HMR, optimized production chunks)
- **React Router v6** (Public routes, lazy-loaded protected Admin layouts)
- **TanStack Query v5** (Server state synchronization & caching)
- **React Hook Form** + **Zod** (Shared client-server validation)
- **Bootstrap 5** + **React-Bootstrap** + **react-icons** (eSushrut G5 exact design system)
- **react-i18next** (Multilingual support: **English**, **Telugu**, **Hindi**)
- **Chart.js** + **react-chartjs-2** (Bar, Line, and Doughnut analytics)
- **Axios** (Bearer token injection, 401 automatic refresh token rotation)

### Backend (`/apps/api`)
- **Node.js 20 LTS** + **NestJS 10** + **TypeScript**
- **PostgreSQL 15+** + **Prisma ORM** (Relations, indexes, raw SQL CHECK constraints)
- **Authentication**: JWT access & refresh tokens, bcrypt password hashing, role guards
- **Security**: Helmet headers, strict CORS whitelist, `@nestjs/throttler` (rate limits), input XSS sanitization
- **QR & Export Engines**:
  - `qrcode`: Generates high-resolution PNG & data URLs
  - `pdfkit`: Generates printable multi-page A4 QR Standees with multilingual signage and executive PDF reports
  - `exceljs`: Exports multi-sheet `.xlsx` workbooks
- **Multer**: Photo upload with strict **magic-byte verification** (`FF D8 FF` for JPEG, `89 50 4E 47` for PNG, max 5 MB)
- **@nestjs/schedule**: Automated cron job for SLA grievance escalation
- **Structured Logging**: `nestjs-pino` with JSON/pretty output
- **API Documentation**: Interactive **Swagger UI** (`/api/docs`)

---

## 3. eSushrut G5 Theme & UI Guidelines

The interface strictly adheres to C-DAC's eSushrut G5 design standards:
- **Header**: Gradient `linear-gradient(135deg, #1E6FD9 0%, #1565C0 100%)`. White bold "eSushrut", yellow-green `#C6E85A` "G5". Right section displays `Welcome : <User>` with white square icon buttons (Profile, Upload, Search, Notifications, Settings, and Red Logout).
- **Main Nav Bar**: Deep Blue `#1565C0`, white bold items; active module = white rounded pill with blue text.
- **Sub-Menu Bar**: Light Blue `#2A75D3`; active tab is Cream `#FFE9A8` with Dark Orange `#C05621` bold text.
- **Content Area**: Neutral background `#EEF2F7`, white cards (radius 6px, soft shadow `rgba(0,0,0,0.06)`), black bold headings ("Services", "Setup", "Reports").
- **List Rows**: Border `#DDE3EA`, bold blue text `#1F5BB5`, hover highlight `#EAF2FF`.
- **Footer**: Blue bar, C-DAC mark, `© Centre For Development Of Advanced Computing`, and live ticking day/date/time clock.

---

## 4. Business Rules & Security Enforcements

1. **Cryptographic QR Integrity**:
   - QR URL format: `https://<domain>/feedback?h=<hospitalId>&d=<deptId>&loc=<locId>&t=<HMAC token>`
   - Generated via HMAC-SHA256 signature combining IDs and secret salt.
   - Forged or altered parameters immediately fail verification (`valid: false`).
2. **Citizen Privacy**:
   - All patient contact numbers in administrative listings and export logs are masked: e.g. `98XXXXXX10`.
3. **Submission Throttling**:
   - Maximum 3 feedback or complaint submissions allowed per mobile number per day.
   - IP rate limiting via `@nestjs/throttler` protects against denial-of-service and automated flooding.
4. **Immediate Low Rating Escalation**:
   - Any overall rating $\le 2$ stars triggers an immediate automated SMS/Email alert to the designated Department In-Charge.
5. **Multi-Tier SLA Escalation Cron**:
   - Evaluates open complaints every 5 minutes. Breached SLA tickets auto-escalate from Level 1 to Level 2 (Department Head) and Level 3 (Medical Superintendent / Super Admin), logging every transition in `ComplaintHistory` and notifying officers via SMS.

---

## 5. Quick Start Guide

### Prerequisites
- Node.js 20 LTS or higher
- PostgreSQL 15+ running locally (or via Docker)

### Installation
```bash
# 1. Clone repository & install dependencies
git clone <repo-url>
cd esushrut-feedback
npm install

# 2. Build shared TypeScript package
npm run build:shared
```

### Database Configuration & Seeding
Update `.env` in `apps/api/.env` with your PostgreSQL credentials:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/esushrut_feedback?schema=public"
```

Push schema, apply raw SQL constraints, and seed realistic hospital data:
```bash
# Push Prisma schema
npm run prisma:generate
cd apps/api
npx prisma db push

# Apply SQL CHECK constraints (1-5 star ratings, 0-10 NPS)
# On Windows / Linux:
psql -U postgres -d esushrut_feedback -f prisma/migrations/constraints.sql

# Seed hospital master, users, departments, and QR records
npm run prisma:seed
```

### Running in Development
```bash
# Run both API and Web concurrently
npm run dev

# Or run separately:
npm run dev:api    # Runs NestJS on http://localhost:4000
npm run dev:web    # Runs Vite on http://localhost:3000
```

Access Points:
- **Patient Mobile View**: `http://localhost:3000/feedback?h=960cc5db-728e-4bf8-840f-cb2c17431772&d=f0ce19ee-83dd-45b3-b54c-2c8336b3d7e5&t=87a09bb565b8a9ebbc0c1e573a0407333d82f7a7c7ba55b4922b48bbbc212551`
- **Citizen Grievance Tracking**: `http://localhost:3000/track`
- **Admin Portal**: `http://localhost:3000/admin/login`
- **Swagger API Docs**: `http://localhost:4000/api/docs`

### Pre-configured Seed Credentials:
| Role | Username | Password | Access Scope |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin` | `Admin@12345` | Global Hospital Administration & Masters |
| **OPD Head** | `head_opd` | `Head@12345` | Outpatient Department Oversight & QR Generation |
| **Feedback Officer** | `officer_nodal` | `Officer@12345` | Grievance Resolution & Ticket Assignment |

---

## 6. Comprehensive Testing Suite

### A. Backend Unit & Integration Tests (Jest + Supertest)
```bash
# Run backend unit tests (HMAC, Ticket IDs, NPS, Rate limit, File validation)
npm run test:api

# Run backend unit tests with 80% coverage check
npm run test:api:cov

# Run API Integration tests (covers negative cases, invalid mobile, tampered token, etc.)
cd apps/api
npx jest test/integration/api.spec.ts
```

### B. Frontend Component Tests (Vitest + React Testing Library + MSW)
```bash
npm run test:web
```

### C. End-to-End Tests (Playwright)
```bash
# Install browsers
npx playwright install

# Run complete E2E test suite (Chrome, Firefox, WebKit, Mobile Viewport & Axe accessibility)
npm run test:e2e
```

### D. High-Concurrency Load Testing (k6)
Simulates 500 concurrent patient submissions under 2-second p95 latency:
```bash
k6 run load-tests/feedback-load-test.js
```

### E. OWASP ZAP Security Baseline Scan
```bash
# Run security scan against live API
chmod +x security/run-zap.sh
./security/run-zap.sh http://localhost:4000/api/docs
```

---

## 7. Docker Deployment

Launch the complete stack (PostgreSQL, NestJS API, React Web, and Nginx reverse proxy):
```bash
docker-compose up -d --build
```
The application will be available on standard port `http://localhost` (via Nginx Gateway).

---

## 8. Manual Test Cases Document

A formal Quality Assurance document with **75 manual test cases** (covering Positive, Negative, Boundary, Role-based, File-security, and SLA auto-escalation scenarios) is available at:
👉 **[docs/MANUAL_TEST_CASES.md](docs/MANUAL_TEST_CASES.md)**
"# Qr-Code-Patient-Feedback-System" 
