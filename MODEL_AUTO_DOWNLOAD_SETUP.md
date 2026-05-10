# Model Auto-Download Setup Guide

This guide explains how to upload your AI model files to GitHub Releases so they auto-download on Render startup.

---

## 🚀 Quick Start

### 1. Prepare Model Files

Locate your model files in `CV_HACKATHON_MODEL_DATASET/`:

**V1 Model (Pathogen Identification)** - ~84 MB total:
- `V1_Model_Output/bacterial_id_model.pkl`
- `V1_Model_Output/antibiotic_strength_model.pkl`
- `V1_Model_Output/label_encoder_id.pkl`
- `V1_Model_Output/label_encoder_str.pkl`
- `V1_Model_Output/v1_feature_columns.pkl`

**V2 Model (Pharmacology/Resistance)** - ~223 MB total:
- `V2_Model_Output/v2_multi_input_model.pkl`
- `V2_Model_Output/v2_multi_input_model_FIXED.pkl`
- `V2_Model_Output/v2_feature_columns.pkl`
- `V2_Model_Output/v2_feature_columns_FIXED.pkl`
- `V2_Model_Output/v2_imputer_FIXED.pkl`

**V3 Model (CNN/CGR Visual Analysis)** - ~16 MB total:
- `V3_Model_Output/v3_vision_model.h5`
- `V3_Model_Output/best_v3_vision_model.h5`

**Total: ~323 MB** (may take 2-5 minutes to download on first Render startup)

**Note:** Don't commit these to Git — they're in `.gitignore` for a reason (too large).

---

### 2. Create GitHub Release

1. Go to your GitHub repo: `https://github.com/YOUR_USERNAME/BV-BRC_Dataset`
2. Click **Releases** (or go to `/releases`)
3. Click **Create a new release**
4. Fill in:
   - **Tag name**: `v1.0-models`
   - **Release title**: `GeneZap AI Models v1.0 - Complete Suite`
   - **Description**:
     ```
     Complete AI model files for GeneZap backend quad-engine analysis.
     
     ✅ V1 Model: Pathogen identification (5 files, ~84 MB)
     ✅ V2 Model: Pharmacology/resistance analysis (5 files, ~223 MB)
     ✅ V3 Model: CNN/CGR visual analysis (2 files, ~16 MB)
     
     Total: 12 model files, ~323 MB
     Auto-downloaded by Render on container startup.
     First download takes 2-5 minutes; subsequent restarts skip download (cached).
     ```

5. Click **Attach binaries** and upload **ALL 12 files** (maintaining folder structure):
   - V1_Model_Output/bacterial_id_model.pkl
   - V1_Model_Output/antibiotic_strength_model.pkl
   - V1_Model_Output/label_encoder_id.pkl
   - V1_Model_Output/label_encoder_str.pkl
   - V1_Model_Output/v1_feature_columns.pkl
   - V2_Model_Output/v2_multi_input_model.pkl
   - V2_Model_Output/v2_multi_input_model_FIXED.pkl
   - V2_Model_Output/v2_feature_columns.pkl
   - V2_Model_Output/v2_feature_columns_FIXED.pkl
   - V2_Model_Output/v2_imputer_FIXED.pkl
   - V3_Model_Output/v3_vision_model.h5
   - V3_Model_Output/best_v3_vision_model.h5

6. Click **Publish release** ✓

---

### 3. Set Environment Variables on Render

The download script will look for these optional env vars (defaults shown):

| Variable | Default | Purpose |
|----------|---------|---------|
| `GITHUB_REPO` | `GeneZap/BV-BRC_Dataset` | Your GitHub repo path |
| `RELEASE_TAG` | `v1.0-models` | GitHub release tag |
| `GITHUB_TOKEN` | (empty) | GitHub token (for private repos only) |

**To set these in Render:**
1. Go to your Render Web Service dashboard
2. **Environment** tab
3. Add:
   ```
   GITHUB_REPO=YOUR_USERNAME/BV-BRC_Dataset
   RELEASE_TAG=v1.0-models
   ```

---

### 4. Redeploy on Render

1. Go to Render dashboard
2. Click your **genezap-backend** service
3. Click **Manual Deploy** (or push to GitHub to trigger auto-deploy)
4. On startup, the container will:
   - Run `download_models.sh`
   - Download models from GitHub Releases
   - Start Uvicorn server
5. Check logs to verify downloads completed ✅

---

## 📊 How It Works

**File: `backend/download_models.sh`**

- Runs on every container startup (before Uvicorn starts)
- Checks if models already exist (skips re-download if present)
- Downloads from GitHub Releases using `curl`
- Retries 3 times if download fails
- Logs progress and file sizes
- Gracefully continues if models unavailable (fallback to quad-engine)

**Dockerfile change:**
```dockerfile
CMD ["sh", "-c", "bash /app/backend/download_models.sh && exec uvicorn main:app ..."]
```

---

## 🔍 Monitoring Downloads

Once deployed, check Render logs to verify all models downloaded:

```
🔄 Initializing AI models for GeneZap backend...
📦 Fetching AI model files from GitHub Release: v1.0-models
📊 Expected total: ~323 MB (may take 2-5 minutes on first startup)

🔹 Downloading V1 (Pathogen Identification) models...
📥 Downloading V1_Model_Output/bacterial_id_model.pkl...
✅ Downloaded V1_Model_Output/bacterial_id_model.pkl (1.7M)
📥 Downloading V1_Model_Output/antibiotic_strength_model.pkl...
✅ Downloaded V1_Model_Output/antibiotic_strength_model.pkl (82M)
[... more V1 files ...]

🔹 Downloading V2 (Pharmacology) models...
📥 Downloading V2_Model_Output/v2_multi_input_model.pkl...
✅ Downloaded V2_Model_Output/v2_multi_input_model.pkl (155M)
[... more V2 files ...]

🔹 Downloading V3 (CNN/CGR Visual Analysis) models...
📥 Downloading V3_Model_Output/v3_vision_model.h5...
✅ Downloaded V3_Model_Output/v3_vision_model.h5 (13M)
[... more V3 files ...]

✅ Model initialization complete
🚀 Starting GeneZap API server...
```

**Success indicators:**
- ✅ All 12 files download without errors
- ✅ File sizes match (within 1-2 MB tolerance)
- ✅ "Model initialization complete" message
- ✅ Uvicorn starts normally

---

## ⚠️ Troubleshooting

**Download fails / timeout**
- GitHub Releases might rate-limit large files
- Solution: Create a `GITHUB_TOKEN` (Personal Access Token) and set it as env var
- Get token: https://github.com/settings/tokens → New token → `public_repo` scope

**Models not found on Render**
- Check the release tag matches `RELEASE_TAG` env var
- Verify file names match exactly in the script
- Check Render logs for specific error

**Slow startup**
- First startup downloads 2GB, takes ~3-5 minutes
- Subsequent restarts skip download (files cached)
- To force re-download, delete `/app/CV_HACKATHON_MODEL_DATASET` on Render

---

## 💾 Persistent Storage Option (Future)

If downloads become slow/unreliable:
- Consider Render Disk ($7/month) for persistent model storage
- Or migrate models to AWS S3 / Hugging Face Hub (free tier)
- This script makes migration easy — just change the download URL

---

**Ready to deploy?**
1. ✅ Push updated code (with `download_models.sh` and new `Dockerfile`)
2. ✅ Create GitHub Release with model files
3. ✅ Set environment variables on Render
4. ✅ Trigger deploy — models download automatically! 🚀
