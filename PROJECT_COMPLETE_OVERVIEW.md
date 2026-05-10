# GeneZap - Comprehensive Project Overview

## 🎯 Project Mission
**GeneZap** is a full-stack web application for **Antimicrobial Resistance (AMR) Detection in Bacterial Genomes**. It analyzes bacterial DNA sequences using four AI models (V1, V2, V3, V4) to predict pathogen identification, antibiotic resistance patterns, and resistance mechanisms.

---

## 📋 Table of Contents
1. [Project Architecture](#project-architecture)
2. [What We Built](#what-we-built)
3. [Technology Stack](#technology-stack)
4. [Deployment Status](#deployment-status)
5. [Current Challenge](#current-challenge)
6. [Workflow & Features](#workflow--features)
7. [File Structure](#file-structure)

---

## 🏗️ Project Architecture

### **Three-Tier System:**

```
┌─────────────────────────────────────────────────────────────┐
│                   FRONTEND (React)                           │
│              https://genezap.vercel.app                      │
│  - Upload DNA files (.fna format)                           │
│  - View 295 public genome pool                              │
│  - Display ML analysis results in real-time                 │
│  - Dashboard with V1/V2/V3/V4 engine results                │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP/HTTPS (CORS enabled)
                     │
┌────────────────────▼────────────────────────────────────────┐
│                  BACKEND (FastAPI)                           │
│             https://genezap.onrender.com                    │
│  - RESTful API for file upload, analysis, pool management   │
│  - Integrated ML Pipeline (V1+V2+V3+V4 quad-engine)         │
│  - Joblib/Keras models loaded from GitHub Releases          │
│  - Dataset pool management (public + user pools)            │
│  - Batch job queuing                                         │
└────────────────────┬────────────────────────────────────────┘
                     │ Direct filesystem
                     │
┌────────────────────▼────────────────────────────────────────┐
│              MODELS & DATA (GitHub Release)                 │
│                v1.0-models tag                              │
│  - 12 AI model files (~323 MB)                             │
│  - Auto-downloaded on container startup                     │
│  - Stored in /app/CV_HACKATHON_MODEL_DATASET/               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 What We Built

### **1. Frontend Application (React + Vite)**
- **Location:** `frontend/` directory
- **Technologies:** React 19, Vite 8, Tailwind CSS v4, Framer Motion
- **Deployed:** Vercel (https://genezap.vercel.app)

**Features:**
- DNA file upload interface
- 295 public bacterial genomes (default pool) browsable
- Real-time analysis result display
- 4 model engines visualization:
  - V1: Pathogen ID + Antibiotic Strength
  - V2: Pharmacology/Resistance Analysis
  - V3: CNN/CGR Visual Analysis
  - V4: CARD Gene Discovery
- Responsive dashboard layout

### **2. Backend API (FastAPI)**
- **Location:** `backend/` directory
- **Technologies:** FastAPI 0.136.1, Uvicorn, Python 3.11
- **Deployed:** Render Docker container (https://genezap.onrender.com)

**Key Endpoints:**
```
POST   /datasets/upload                  # Single file upload
POST   /datasets/files/{file_id}/analyze # Run analysis
GET    /datasets/pools/default           # Public pool metadata
GET    /datasets/pools/{pool_id}/files   # Pool file listing
POST   /datasets/pools/{pool_id}/batch   # Batch analysis job
GET    /health                           # Health check
```

### **3. AI/ML Models**

#### **V1 Model: Pathogen Identification**
- **Files:** 5 total (~84 MB)
  - `bacterial_id_model.pkl` (1.67 MB) - Classification model
  - `antibiotic_strength_model.pkl` (82 MB) - Strength predictor
  - `label_encoder_id.pkl` - Labels for species
  - `label_encoder_str.pkl` - Labels for antibiotic strength
  - `v1_feature_columns.pkl` - Feature list
- **Purpose:** Identifies bacterial pathogen species + predicts antibiotic resistance strength
- **Input:** DNA sequences (FASTA)
- **Output:** Pathogen name, confidence score, antibiotic strength tier

#### **V2 Model: Pharmacology & Resistance**
- **Files:** 5 total (~223 MB)
  - `v2_multi_input_model.pkl` (155 MB)
  - `v2_multi_input_model_FIXED.pkl` (67 MB) - Improved variant
  - `v2_feature_columns.pkl` - Feature list
  - `v2_feature_columns_FIXED.pkl` - Improved feature list
  - `v2_imputer_FIXED.pkl` - Missing value handler
- **Purpose:** Analyzes pharmacology data and multi-drug resistance patterns
- **Output:** Resistance to 20+ antibiotic classes

#### **V3 Model: CNN/CGR Visual Analysis**
- **Files:** 2 total (~16 MB)
  - `v3_vision_model.h5` (13 MB) - Main CNN model
  - `best_v3_vision_model.h5` (3 MB) - Optimized version
- **Architecture:** TensorFlow/Keras CNN
- **Purpose:** Visual pattern analysis using Chaos Game Representation (CGR) images
- **Output:** Resistance markers from visual patterns

#### **V4 Model: CARD Gene Discovery**
- **Database:** CARD.fasta file (bacterial resistance gene database)
- **Purpose:** Gene-level resistance mechanism identification
- **Method:** BLAST/sequence matching

### **4. Public Dataset Pool**
- **Location:** `data/datasets/pools/default-public-pool/`
- **Content:** 295 bacterial genomes (~2.7-2.8 MB each)
  - Filenames: `genome_001.fna` through `genome_295.fna`
  - Total size: ~800 GB (but read-only, browsable)
- **Access:** Via REST API or web UI
- **Features:** Read-only, cannot upload/delete

---

## 🛠️ Technology Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Frontend** | React | 19 | UI/UX |
| | Vite | 8 | Build tool |
| | Tailwind CSS | 4 | Styling |
| | Framer Motion | Latest | Animations |
| **Backend** | FastAPI | 0.136.1 | REST API |
| | Uvicorn | 0.46.0 | ASGI server |
| | Python | 3.11 | Runtime |
| **ML/AI** | TensorFlow | 2.21.0 | Deep learning |
| | Keras | 3.13.2 | Neural networks |
| | Scikit-learn | Latest | ML algorithms |
| | Joblib | Latest | Model serialization |
| | Pandas | Latest | Data processing |
| **Deployment** | Docker | Latest | Containerization |
| | Vercel | - | Frontend hosting |
| | Render | - | Backend hosting |
| | GitHub Releases | - | Model storage |

---

## 🌐 Deployment Status

### **Frontend: ✅ LIVE**
- **URL:** https://genezap.vercel.app
- **Platform:** Vercel (serverless)
- **Status:** Deployed & working
- **Features:** All UI components functional

### **Backend: ✅ LIVE (With Models)**
- **URL:** https://genezap.onrender.com
- **Platform:** Render (Docker container)
- **Status:** Deployed with real ML models
- **Health Check:** https://genezap.onrender.com/health
- **Models Downloaded:** ✅ All 12 files (~323 MB)

### **Data Storage:**
- **Models:** GitHub Releases (v1.0-models tag)
- **Public Pool:** Local filesystem in container
- **User Uploads:** Render ephemeral storage (lost on redeploy)
- **Dataset Pools:** PostgreSQL database (future: optional)

---

## ⚠️ Current Challenge

### **Problem: Missing sklearn Module**
**Error:** `ModuleNotFoundError: No module named 'sklearn'`

**Root Cause:**
- V1/V2 models use scikit-learn for feature scaling and preprocessing
- `sklearn` was not in `backend/requirements.txt`
- Docker container built without the dependency
- Integrated pipeline fails → falls back to quad-engine

**Solution Applied:**
1. ✅ Added `scikit-learn` to `backend/requirements.txt`
2. ✅ Pushed to GitHub
3. ⏳ Render auto-redeploys (watch logs for sklearn installation)
4. ⏳ Real ML inference will activate once models load successfully

**Status:** Awaiting Render redeploy (~2-3 minutes)

---

## 🔄 Workflow & Features

### **User Analysis Workflow:**

```
1. USER UPLOADS DNA FILE
   ↓
2. FILE STORED IN RENDER EPHEMERAL STORAGE
   ↓
3. FEATURE EXTRACTION
   ↓
4. PARALLEL MODEL INFERENCE
   ├─ V1: Species + Antibiotic Strength
   ├─ V2: Drug Resistance Profile
   ├─ V3: CNN Visual Analysis
   └─ V4: Gene Discovery (BLAST)
   ↓
5. RESULTS AGGREGATED & RETURNED TO FRONTEND
   ↓
6. FRONTEND DISPLAYS IN DASHBOARD
```

### **Key Features Implemented:**

| Feature | Status | Details |
|---------|--------|---------|
| File Upload | ✅ Working | Single FASTA files accepted |
| Public Pool | ✅ Working | 295 genomes browsable & readable |
| V1 Inference | ⏳ Activating | Requires sklearn |
| V2 Inference | ⏳ Activating | Requires sklearn |
| V3 Inference | ✅ Working | TensorFlow models loaded |
| V4 Gene Discovery | ✅ Working | CARD database ready |
| Batch Analysis | ✅ Working | Queue multiple files |
| Pool Management | ✅ Working | Create/list pools |
| CORS Support | ✅ Configured | Vercel ↔ Render communication |
| Model Auto-Download | ✅ Working | GitHub Release download script |

---

## 📁 File Structure

```
BV-BRC_Dataset/
│
├── frontend/                              # React web app
│   ├── src/
│   │   ├── components/
│   │   │   └── dataset/
│   │   │       └── DatasetPoolPanel.jsx   # Pool UI component
│   │   ├── services/
│   │   │   └── datasetsApi.js             # API client
│   │   └── App.jsx
│   ├── package.json
│   ├── vite.config.js
│   └── vercel.json
│
├── backend/                               # FastAPI backend
│   ├── main.py                            # App entry point
│   ├── analysis.py                        # Analysis orchestration
│   ├── integrated_pipeline_real.py        # V1/V2/V3 inference
│   ├── quad_engine_inference.py           # Quad-engine fallback
│   ├── download_models.sh                 # GitHub Release downloader
│   ├── requirements.txt                   # Python dependencies (NOW WITH SKLEARN!)
│   ├── dataset_pools/
│   │   ├── router.py                      # Pool REST endpoints
│   │   ├── models.py                      # Pydantic models
│   │   └── repository.py                  # Pool CRUD logic
│   └── middleware/
│       └── max_body.py                    # Request size limiter
│
├── CV_HACKATHON_MODEL_DATASET/            # AI Models (from GitHub Releases)
│   ├── V1_Model_Output/
│   │   ├── bacterial_id_model.pkl
│   │   ├── antibiotic_strength_model.pkl
│   │   ├── label_encoder_*.pkl
│   │   └── v1_feature_columns.pkl
│   ├── V2_Model_Output/
│   │   ├── v2_multi_input_model.pkl
│   │   ├── v2_multi_input_model_FIXED.pkl
│   │   ├── v2_feature_columns*.pkl
│   │   └── v2_imputer_FIXED.pkl
│   ├── V3_Model_Output/
│   │   ├── v3_vision_model.h5
│   │   └── best_v3_vision_model.h5
│   └── V4_GENE_DETECTION/
│       └── CARD.fasta
│
├── data/datasets/pools/
│   └── default-public-pool/
│       ├── files/
│       │   ├── genome_001.fna
│       │   ├── genome_002.fna
│       │   └── ... (295 total)
│       └── pool_manifest.json              # Metadata for all genomes
│
├── Dockerfile                             # Docker image definition
├── docker-compose.yml
├── MODEL_AUTO_DOWNLOAD_SETUP.md           # Setup guide
├── PROJECT_COMPLETE_OVERVIEW.md           # This file!
└── .gitignore                             # Excludes models from git
```

---

## 🔑 Key Environment Variables

### **Backend (Render):**
```
GENEZAP_DATASETS_ROOT=/data/datasets         # Pool storage
GENEZAP_CV_ARTIFACT_ROOT=/app/CV_HACKATHON_MODEL_DATASET  # Model path
GENEZAP_ENV=production                       # Environment
GITHUB_REPO=GeneZap/PROJECT                  # For model download
RELEASE_TAG=v1.0-models                      # GitHub Release tag
PORT=10000                                   # Render port (set by Render)
GENEZAP_CORS_ORIGINS=https://genezap.vercel.app,http://localhost:5173  # CORS
```

### **Frontend (.env):**
```
VITE_API_URL=https://genezap.onrender.com    # Backend URL
```

---

## 🔐 Security & Access Control

- **Public Pool:** Read-only, cannot modify
- **User Pools:** Create/manage own pools (authenticated in future)
- **CORS:** Restricted to Vercel frontend + localhost (dev)
- **File Uploads:** Max body size limited to 50 MB per file
- **Health Endpoint:** Public (for uptime monitoring)

---

## 📊 Data Flow Example

### **Scenario: User uploads genome_001.fna from public pool**

```
1. Frontend calls POST /datasets/upload
   Body: { file: <binary>, pool_id: "default-public-pool" }
   
2. Backend receives file, saves to /data/datasets/pools/default-public-pool/files/
   
3. User clicks "Analyze"
   Frontend calls POST /datasets/pools/default-public-pool/files/{file_id}/analyze
   
4. Backend:
   ├─ Loads file content
   ├─ Tries integrated_pipeline_real.py:
   │  ├─ Loads V1 model from joblib
   │  ├─ Loads V2 model from joblib
   │  ├─ Loads V3 model from Keras
   │  ├─ Runs feature extraction (sklearn)
   │  ├─ Scores models
   │  └─ Returns results JSON
   └─ If any error → falls back to quad-engine
   
5. Frontend receives JSON with keys:
   {
     "v1_engine": { "pathogen": "...", "antibiotic_strength": "..." },
     "v2_engine": { "resistance_profile": [...] },
     "v3_engine": { "visual_patterns": [...] },
     "quad_engine": { "generic_scores": [...] }
   }
   
6. Frontend renders in dashboard with tabs for each engine
```

---

## 🛑 Known Issues & Workarounds

| Issue | Status | Workaround |
|-------|--------|-----------|
| Models missing in first deploy | ✅ FIXED | Auto-download script now working |
| Curl not in Docker image | ✅ FIXED | Added curl to apt-get install |
| Sklearn missing | ⏳ FIXING | Added to requirements.txt |
| Models stored in Git | ✅ FIXED | Using GitHub Releases |
| User pools not persistent | ⏳ KNOWN | Use ephemeral storage or DB |
| Render free tier cold starts | ⏳ PENDING | Setup UptimeRobot monitor |

---

## 🚀 Next Steps (Optional Enhancements)

1. **Database Integration:** PostgreSQL for persistent dataset pools
2. **Authentication:** User accounts & pool permissions
3. **Caching:** Redis for model predictions
4. **Monitoring:** UptimeRobot health checks (free tier)
5. **Advanced Features:**
   - Batch genome analysis
   - Comparative resistance analysis
   - Publication export (PDF reports)
   - Team collaboration
   - Model retraining pipeline

---

## 📞 Quick Reference

| Item | Value |
|------|-------|
| Frontend URL | https://genezap.vercel.app |
| Backend URL | https://genezap.onrender.com |
| GitHub Repo | https://github.com/GeneZap/PROJECT |
| Models Release | v1.0-models tag |
| Public Genomes | 295 (default-public-pool) |
| Model Files | 12 total (~323 MB) |
| Model Types | V1, V2, V3, V4 quad-engine |
| Current Status | **Live & Functional (waiting for sklearn redeploy)** |

---

## 🎓 How to Explain This to Another AI

**"GeneZap is a full-stack genomics analysis platform with:**
- **React frontend** deployed on Vercel at genezap.vercel.app
- **FastAPI backend** deployed on Render running Python with 4 ML models
- **12 AI model files** (323 MB) stored in GitHub Releases and auto-downloaded on startup
- **295 public bacterial genomes** browsable in web UI (default-public-pool)
- **Real-time analysis:** Users upload DNA files → Backend runs V1/V2/V3/V4 ML inference → Results displayed in frontend dashboard
- **Current status:** Fully deployed, models downloading successfully, but sklearn dependency missing in last redeploy - just fixed by adding to requirements.txt

**The quad-engine means:** V1 (pathogen ID) + V2 (resistance analysis) + V3 (CNN visual) + V4 (gene discovery) run in parallel on uploaded genomes."**

---

**Last Updated:** May 10, 2026
**Status:** ✅ Live (Awaiting sklearn fix deployment)