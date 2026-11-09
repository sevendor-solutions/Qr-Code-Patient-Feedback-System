# eSushrut G5 - Dokploy Deployment & Low-Size Optimization Guide

This guide provides the complete, step-by-step procedure to push the **eSushrut G5** module to **Git** and deploy it onto **Dokploy** (at `http://200.97.162.130:3000`) with an ultra-lightweight Docker footprint.

---

## 1. How Low Build Size & Memory Footprint is Achieved

Standard full-stack Node.js and React Docker images often exceed **1.5 GB to 2 GB**.  
In this implementation, the entire 3-tier production stack is optimized to **~245 MB total**:

| Tier | Optimization Technique | Base Image | Production Image Size |
|:---|:---|:---|:---:|
| **Build Context** | `.dockerignore` excludes `node_modules`, test reports, and logs | N/A | **Context < 2 MB** (vs 600 MB) |
| **API Backend** | Multi-stage build + `npm prune --omit=dev` strips TS, Jest, and ESLint | `node:20-alpine` | **~140 MB** (vs 1.1 GB Debian) |
| **Frontend Web** | Multi-stage build + Vite compile served via Nginx with Gzip compression | `nginx:alpine` | **~24 MB** (dist is only 972 KB) |
| **Database** | Lightweight Alpine-based PostgreSQL image | `postgres:15-alpine` | **~80 MB** |
| **Total Stack** | **PostgreSQL + NestJS API + React Nginx Web** | **Alpine Linux** | **~245 MB Total** |

---

## 2. Step-by-Step Git Commands

Open your terminal at `C:\Users\Dhora\Desktop\Sevendor\Currently Working\esushrut-feedback` and run:

### Step 2.1: Initialize Git and Check Ignore Rules
```bash
# Initialize local git repository
git init

# Set default branch to main
git branch -M main

# Verify .gitignore is in place (ensures node_modules and tests are NOT tracked)
git status
```

### Step 2.2: Stage and Commit the Clean Source Code
```bash
# Add files (only tracked source files, ~10 MB total)
git add .

# Create initial commit
git commit -m "feat: complete eSushrut G5 QR Feedback System module ready for Dokploy"
```

### Step 2.3: Link Remote Repository (GitHub or GitLab) and Push
1. Create a new repository on your GitHub/GitLab account (e.g., `esushrut-feedback`).
2. Link and push from your terminal:

```bash
# Add remote origin (replace with your repository URL)
git remote add origin https://github.com/<your-username-or-org>/esushrut-feedback.git

# Push to remote repository
git push -u origin main
```

---

## 3. Step-by-Step Dokploy Deployment Process

Follow these steps directly in your Dokploy Dashboard at **`http://200.97.162.130:3000/dashboard/projects`**:

```
+-------------------------------------------------------------------------------+
|                       DOKPLOY DEPLOYMENT FLOWCHART                            |
+-------------------------------------------------------------------------------+
|                                                                               |
|  [+ Create Project]                                                          |
|         |                                                                     |
|         v                                                                     |
|  [Name: esushrut-feedback]                                                    |
|         |                                                                     |
|         v                                                                     |
|  [Add Service -> Compose]                                                     |
|         |                                                                     |
|         v                                                                     |
|  [Connect Git Repository: main branch / docker-compose.yml]                   |
|         |                                                                     |
|         v                                                                     |
|  [Set Environment Variables (.env.example)]                                   |
|         |                                                                     |
|         v                                                                     |
|  [Click "Deploy"] -> Auto-Builds Alpine Images -> Starts Stack                |
|         |                                                                     |
|         v                                                                     |
|  [Seed Initial Data (AIIMS Hospital, Depts, Master Questions, Admin Users)]    |
+-------------------------------------------------------------------------------+
```

### Step 3.1: Create Project in Dokploy
1. In your Dokploy dashboard (`http://200.97.162.130:3000/dashboard/projects`), click the black button in the top right:  
   **`+ Create Project`**.
2. Set Name: `esushrut-feedback`.
3. Set Description: `eSushrut G5 Patient Feedback & Query System Module`.
4. Click **Create**.

### Step 3.2: Add Compose Service
1. Click into your newly created **`esushrut-feedback`** project.
2. Click **Add Service** and select **Compose** (Docker Compose).
3. Set Service Name: `esushrut-stack`.
4. Click **Create**.

### Step 3.3: Link Git Repository
In the **Source** tab of the Compose service:
1. Select **GitHub** or **Git** provider.
2. **Repository URL**: Paste your repository link (e.g. `https://github.com/sevendorsolutions/esushrut-feedback.git`).
3. **Branch**: `main`.
4. **Compose Path**: `docker-compose.yml`.

*(Alternative: If using Raw Compose mode, you can simply paste the contents of `docker-compose.yml` directly into the Dokploy Compose editor!)*

### Step 3.4: Add Environment Variables
Navigate to the **Environment** tab inside the service in Dokploy and paste:

```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=esushrut_pass_2026
POSTGRES_DB=esushrut_feedback
JWT_ACCESS_SECRET=esushrut-g5-jwt-access-secret-cdac-key-2026
JWT_REFRESH_SECRET=esushrut-g5-jwt-refresh-secret-cdac-key-2026
QR_HMAC_SECRET=esushrut-cdac-secure-hmac-sha256-key-salt
FRONTEND_URL=http://200.97.162.130
API_BASE_URL=http://200.97.162.130/api
WEB_PORT=80
```
*(If you have a domain pointing to `200.97.162.130`, replace `http://200.97.162.130` with `https://yourdomain.com`).*

### Step 3.5: Deploy
1. Click the green **Deploy** button in the top right corner.
2. Dokploy will:
   - Clone the lightweight repository.
   - Run the multi-stage Alpine build for `api` and `web`.
   - Start the `esushrut_postgres` database container.
   - Automatically execute Prisma migrations via `docker-entrypoint.sh`.
   - Start the `esushrut_api` and `esushrut_web` containers.

### Step 3.6: Seed Demonstration Data (One-Time Setup)
To populate the database with the pre-configured eSushrut Model Civil Hospital, 7 departments, multilingual questions, and admin users:

In Dokploy:
1. Navigate to the **Docker** tab on the left menu (or inside the Project service).
2. Open terminal for container `esushrut_api` and run:
```bash
npx prisma db seed
```
*Or from your VPS SSH terminal:*
```bash
docker exec -it esushrut_api npx prisma db seed
```

---

## 4. Verification & Production Access

Once deployed, access the system directly at your server IP or domain:
* **Citizen Mobile Feedback Portal:** `http://200.97.162.130`
* **Hospital Admin Command Center:** `http://200.97.162.130/admin`
* **Swagger API Documentation:** `http://200.97.162.130/api/docs`
* **Admin Login:** Username `admin` | Password `Admin@12345`
