# 🚀 Production Deployment Guide

**GeneZap** is production-ready for Vercel (frontend) + Render (backend) deployment.

---

## Pre-Deployment Checklist

- ✅ **Backend**: FastAPI 0.136.1 + Uvicorn configured
- ✅ **Frontend**: React 19 + Vite 8 with Vercel config
- ✅ **Docker**: Root `Dockerfile` for containerized backend
- ✅ **Public Dataset Pool**: 295 bacterial genomes pre-loaded
- ✅ **Environment Configs**: `.env.example` files ready for both services
- ✅ **Cleanup**: Temporary debug scripts and documentation removed

---

## 🔧 Backend Deployment (Render)

### 1. Create Render Web Service

1. Go to [https://render.com/dashboard](https://render.com/dashboard)
2. Click **New +** → **Web Service**
3. Connect your GitHub repository
4. Configure:
   - **Name**: `genezap-backend` (or your choice)
   - **Root Directory**: `./` (project root)
   - **Runtime**: `Docker`
   - **Instance Type**: `Starter` (free tier) or higher for production
   - **Auto-deploy**: Enable (optional)

### 2. Set Environment Variables

Add in Render dashboard **Environment** tab:

```
GENEZAP_ENV=production
GENEZAP_CORS_ORIGINS=https://your-frontend.vercel.app,http://localhost:5173
GENEZAP_CORS_CREDENTIALS=true
GENEZAP_LOG_LEVEL=INFO
GENEZAP_MAX_UPLOAD_MB=100
GENEZAP_MAX_POOL_FILE_MB=100
GENEZAP_MAX_POOL_FILES_PER_REQUEST=25
GENEZAP_MAX_BATCH_FILES=50
GENEZAP_DATASETS_ROOT=/var/data/datasets
GENEZAP_ALLOW_DATASET_PATH_IMPORT=0
```

### 3. Public Pool Setup (Post-Deployment)

After backend deploys, SSH into the container and populate the public pool:

```bash
# Download populated pool data (or recreate)
mkdir -p /var/data/datasets/pools/default-public-pool/files
# Copy or restore pool_manifest.json and 295 genome files
```

**Alternative**: Modify backend startup to auto-initialize pool on first run (recommended for production).

### 4. Verify Backend Health

```bash
curl https://your-backend.onrender.com/health
```

Expected: `200 OK` with `{"status": "running"}`

---

## 🎨 Frontend Deployment (Vercel)

### 1. Create Vercel Project

1. Go to [https://vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Vercel auto-detects Vite configuration
4. Configure:
   - **Framework**: Vite
   - **Root Directory**: `./frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### 2. Set Environment Variables

Add in Vercel dashboard **Settings** → **Environment Variables**:

```
VITE_API_BASE_URL=https://your-backend.onrender.com/api
```

### 3. Deploy

- Vercel auto-deploys on push to `main` (or your default branch)
- Deployment completes in ~60 seconds

### 4. Verify Frontend

Visit your Vercel deployment URL. Verify:
- ✅ UI loads without errors
- ✅ "Dataset pool" tab accessible
- ✅ "Use Public Pool" button loads 295 genomes
- ✅ Analysis request reaches backend (check network tab)

---

## 🗂️ File Structure for Production

```
project-root/
├── backend/                          # FastAPI app (deployed to Render)
│   ├── main.py                       # FastAPI entry point
│   ├── analysis.py                   # Quad-engine orchestrator
│   ├── dataset_pools/                # Pool management module
│   ├── requirements.txt               # Python dependencies
│   ├── .env                           # (LOCAL ONLY - not committed)
│   └── env.example                    # Template for .env
├── frontend/                         # React/Vite app (deployed to Vercel)
│   ├── package.json
│   ├── vite.config.js
│   ├── vercel.json                   # Vercel deployment config
│   ├── src/
│   ├── .env.example                   # Template for .env.local
│   └── .env.local                     # (LOCAL ONLY - not committed)
├── data/
│   └── datasets/
│       └── pools/
│           └── default-public-pool/  # 295 bacterial genomes (local/blob storage)
├── Dockerfile                        # Backend container definition
├── .dockerignore
├── .gitignore                        # Excludes .venv, node_modules, data/*
└── README.md

```

---

## 🔐 Secrets & Security

### Never Commit

- `.env` files (use `.env.example` as template)
- API keys, credentials, or tokens
- Private data or model weights

### Environment-Specific Configs

| Variable | Local Dev | Staging | Production |
|----------|-----------|---------|------------|
| `GENEZAP_ENV` | `development` | `staging` | `production` |
| `GENEZAP_CORS_ORIGINS` | `http://localhost:5173` | `https://staging.app` | `https://app.vercel.app` |
| `GENEZAP_ALLOW_DATASET_PATH_IMPORT` | `1` (enable) | `0` | `0` |

---

## 📊 Expected Backend Response Time

- **Analyze 1 genome**: ~3–5 seconds (quad-engine parallel)
- **Batch job (25 files)**: ~60–90 seconds
- **Public pool load**: <100 ms

If slower, check:
- Backend CPU/memory on Render (may need upgrade)
- Network latency between Vercel and Render

---

## 🚨 Troubleshooting

### "CORS error on frontend requests"

**Fix**: Ensure `GENEZAP_CORS_ORIGINS` in Render includes your Vercel URL.

```
GENEZAP_CORS_ORIGINS=https://your-app.vercel.app,http://localhost:5173
```

### "Public pool returns 404"

**Likely cause**: Pool not initialized on Render. Manually create or auto-initialize on startup.

### "Analysis timeout"

**Fix**: Increase request timeout in frontend API client or upgrade Render instance.

---

## 📞 Monitoring & Logs

### Render Backend Logs

- Dashboard: **Services** → **genezap-backend** → **Logs**
- Real-time streaming available
- Set `GENEZAP_LOG_LEVEL=DEBUG` for verbose output

### Vercel Frontend Logs

- Dashboard: **Deployments** → **Logs**
- Check browser console (F12) for client-side errors

---

## 🎯 Next Steps

1. **Push to GitHub**: Ensure all temporary files are removed ✅
2. **Deploy backend to Render**: Follow section "Backend Deployment"
3. **Deploy frontend to Vercel**: Follow section "Frontend Deployment"
4. **Initialize public pool**: Copy 295 genomes to Render `/var/data/datasets/pools/default-public-pool/`
5. **Test end-to-end**: UI → Analysis → Results
6. **Monitor logs** for errors and adjust configs as needed

---

**Questions?** Refer to main [README.md](./README.md) for architecture details and [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) for advanced configurations.
