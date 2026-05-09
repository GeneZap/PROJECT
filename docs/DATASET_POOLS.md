# Dataset pools (FASTA management)

## Architecture decision (no SQL at 50–100 scale)

Pools use **managed filesystem storage** under `data/datasets/` (override with `GENEZAP_DATASETS_ROOT`) plus a **`pool_manifest.json`** per pool. This keeps deployment simple, avoids a DB migration path for demos, and remains easy to back up (copy one directory). For multi-tenant production, add **PostgreSQL** for ACLs and job metadata later; blobs should still live in object storage or on disk.

## Layout

```
data/datasets/
  pools/
    {uuid}/
      pool_manifest.json    # name, version, file index
      files/                  # stored FASTA blobs
      snapshots/              # optional JSON copies on version bump
  jobs/
    {job_id}/
      meta.json
      results/{file_id}.json
```

## API (prefix `/datasets`)

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/datasets/pools` | Create pool (`{ "name", "description" }`) |
| GET | `/datasets/pools` | List pools |
| GET | `/datasets/pools/{pool_id}` | Pool detail + files |
| DELETE | `/datasets/pools/{pool_id}` | Delete pool |
| POST | `/datasets/pools/{pool_id}/files` | Multipart field **`files`** (repeat for each FASTA) |
| POST | `/datasets/pools/{pool_id}/import-path` | Server-side directory copy (requires env, see below) |
| POST | `/datasets/pools/{pool_id}/snapshot` | Bump `manifest_version`, write `snapshots/vN.json` |
| POST | `/datasets/pools/{pool_id}/files/{file_id}/analyze` | Same inference as `POST /analyze` (query: `pitch_demo`, `use_integrated_real`) |
| POST | `/datasets/pools/{pool_id}/batch-jobs` | Body `{ "file_ids": [...], "pitch_demo", "use_integrated_real" }` → `{ job_id }` |
| GET | `/datasets/batch-jobs/{job_id}` | Job progress |
| GET | `/datasets/batch-jobs/{job_id}/results/{file_id}` | One finished result JSON |
| GET | `/datasets/config/hints` | Non-secret limits + paths for operators (lock down if you add auth) |

**Existing** `POST /analyze` is unchanged.

Uploads are validated (size, extension, basic FASTA shape). Limits are env-driven — see `backend/env.example` and `docs/DEPLOYMENT.md`.

## Environment variables

| Variable | Purpose |
|----------|---------|
| `GENEZAP_ENV` | `production` / `prod` / `staging` → disables path import regardless of other flags |
| `GENEZAP_DATASETS_ROOT` | Absolute path for `pools/` and `jobs/` (default: repo `data/datasets`; use `/data/datasets` in Docker) |
| `GENEZAP_ALLOW_DATASET_PATH_IMPORT` | `1` / `true` to allow `import-path` in **non-production** only |
| `GENEZAP_MAX_UPLOAD_MB` | Max request / analyze payload (default 100) |
| `GENEZAP_MAX_POOL_FILE_MB` | Per pool file cap (defaults to upload cap) |
| `GENEZAP_MAX_POOL_FILES_PER_REQUEST` | Multipart file count per upload (default 25) |
| `GENEZAP_MAX_BATCH_FILES` | Max `file_ids` per batch job (default 50) |
| `GENEZAP_CORS_ORIGINS` | Comma-separated browser origins (see `backend/env.example`) |

## Import your reduced FASTA folder

### Option A — UI (path import)

1. Start API with `GENEZAP_ALLOW_DATASET_PATH_IMPORT=1` and **without** `GENEZAP_ENV=production`.
2. Frontend → **Dataset pool** → create or select a pool.
3. Paste the **absolute path** on the machine running the API (not the browser machine, unless they are the same).
4. **Import directory**.

### Option B — Multipart upload (no server env)

Use the pool panel **Choose files** with multi-select, or `curl`:

```bash
# Create pool
curl -s -X POST http://localhost:8000/datasets/pools -H "Content-Type: application/json" \
  -d "{\"name\":\"BV-BRC subset\",\"description\":\"50-100 genomes\"}"

# Upload (replace POOL_ID)
curl -s -X POST http://localhost:8000/datasets/pools/POOL_ID/files -F "files=@./genome1.fna" -F "files=@./genome2.fna"
```

### Option C — Copy into managed storage (production-friendly)

Copy or `rsync` FASTA files into `GENEZAP_DATASETS_ROOT/pools/{new-uuid}/files/` and hand-edit `pool_manifest.json` — **not recommended**; use API or a small admin script instead.

## External drive vs managed storage

| Approach | Pros | Cons |
|----------|------|------|
| **Reference path only** | No copy | API host must see path forever; breaks if drive letter changes; unsafe multi-user |
| **Copy into `GENEZAP_DATASETS_ROOT`** | Portable, reproducible | Uses disk once |
| **Symlinks** | Saves space | Deployment-specific; Windows symlinks need privileges |
| **Mount + import-path** | Good for huge corpora | Still need guarded import or ETL job |

**Recommendation:** For local dev, **import-path** or **multipart**. For deployment, **copy or sync into** object storage / managed volume and register via API.

## Frontend

- `VITE_API_BASE_URL` — optional override for API origin (default `http://localhost:8000`).
- **Single FASTA** tab → existing flow.
- **Dataset pool** tab → pool CRUD, uploads, optional path import, run / batch.

## Local run

```bash
# Terminal 1
cd backend
uvicorn main:app --reload --port 8000

# Terminal 2
cd frontend
npm install
npm run dev
```

## Testing checklist

1. `GET /health` → 200  
2. `POST /datasets/pools` → pool id  
3. `POST /datasets/pools/{id}/files` with 2 FASTA → file list  
4. `POST /datasets/pools/{id}/files/{file_id}/analyze` → same shape as `/analyze`  
5. UI: Single FASTA still scans  
6. UI: Pool tab creates pool, uploads, **Run** shows report  

## SQLite vs PostgreSQL (when to add)

- **SQLite**: single-server, few users, fine for **metadata + job queue** if you outgrow JSON manifests.  
- **PostgreSQL**: HA, row-level security, concurrent writers, better for **multi-tenant** and audit.  

Vector DBs are **not** required for this FASTA pool feature.
