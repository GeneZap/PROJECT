"""GeneZap FastAPI server — genome analysis and engine consensus."""

from __future__ import annotations

import logging
import os
import sys
from typing import Any

# Reduce TF log noise and glibc malloc fragmentation before heavy imports.
os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "2")
os.environ.setdefault("MALLOC_ARENA_MAX", "2")

from fastapi import FastAPI, File, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict

from analysis import analyze_sequence_bytes
from dataset_pools.router import router as datasets_router
from genezap_settings import cors_allow_credentials, cors_allow_origins, log_level, max_upload_bytes
from middleware.max_body import MaxBodySizeMiddleware

# ---------------------------------------------------------------------------
# Logging (structured enough for Render/Fly log drains; upgrade to JSON later)
# ---------------------------------------------------------------------------
_level_name = log_level()
_level = getattr(logging, _level_name, logging.INFO)
logging.basicConfig(
    level=_level,
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S",
    stream=sys.stdout,
    force=True,
)
log = logging.getLogger("genezap.main")

app = FastAPI(title="GeneZap API", version="1.0.0")
app.include_router(datasets_router)

# Body size guard (multipart counts as one Content-Length).
app.add_middleware(MaxBodySizeMiddleware, max_bytes=max_upload_bytes())

_origins = cors_allow_origins()
_credentials = cors_allow_credentials()
if any((o or "").strip() == "*" for o in _origins):
    log.warning("CORS wildcard origin in use; set GENEZAP_CORS_ORIGINS for production hardening.")

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)


class FinalRecommendationModel(BaseModel):
    model_config = ConfigDict(extra="allow")

    level: str
    title: str
    summary: str
    banner_tone: str


class SusceptibilityProfileModel(BaseModel):
    """Antibiotic stewardship lists derived from CARD / engine consensus."""

    model_config = ConfigDict(extra="allow")

    resistant_to: list[str] = []
    alternative_options: list[str] = []


class DiagnosticReportModel(BaseModel):
    model_config = ConfigDict(extra="allow")

    sequence_length: int
    gc_content: float
    fasta_header: str | None = None
    kmer_histogram_png_base64: str
    kmer_stats: dict[str, float] | None = None
    engines: dict[str, Any]
    client_warnings: list[str] | None = None


class AnalyzeResponse(BaseModel):
    model_config = ConfigDict(extra="allow")

    status: str
    patient_id: str
    diagnostic_report: DiagnosticReportModel
    final_recommendation: FinalRecommendationModel
    susceptibility_profile: SusceptibilityProfileModel | None = None


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "genezap"}


@app.get("/health/live")
def health_live() -> dict[str, str]:
    """Process is up (orchestrator / load balancers)."""
    return {"status": "live", "service": "genezap"}


@app.get("/ready")
def ready() -> dict[str, Any]:
    """Writable dataset root — fails if volume misconfigured (503 for K8s-style probes)."""
    from fastapi.responses import JSONResponse

    from dataset_pools.config import get_datasets_root

    root = get_datasets_root()
    try:
        root.mkdir(parents=True, exist_ok=True)
        probe = root / ".write_probe"
        probe.write_text("ok", encoding="utf-8")
        probe.unlink(missing_ok=True)
    except OSError as e:
        log.error("Readiness failed: datasets root not writable: %s", e)
        return JSONResponse(
            status_code=503,
            content={"status": "not_ready", "datasets_root": str(root), "detail": str(e)},
        )
    return {"status": "ready", "datasets_root": str(root)}


@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze(
    file: UploadFile = File(...),
    pitch_demo: bool = Query(
        False,
        description="Salmonella MDR demo JSON (replaces engines). Ignored when use_integrated_real=true.",
    ),
    use_integrated_real: bool = Query(
        False,
        description=(
            "Use CV_HACKATHON_MODEL_DATASET joblib/Keras artifacts (see GENEZAP_CV_ARTIFACT_ROOT). "
            "Falls back to quad-engine on failure. Incompatible with pitch_demo."
        ),
    ),
) -> AnalyzeResponse:
    if not file.filename or not file.filename.lower().endswith((".fna", ".fasta", ".fa")):
        raise HTTPException(
            status_code=400,
            detail="Upload a FASTA file (.fna, .fasta, or .fa).",
        )
    raw = await file.read()
    if not raw:
        raise HTTPException(status_code=400, detail="Empty file.")
    lim = max_upload_bytes()
    if len(raw) > lim:
        raise HTTPException(
            status_code=413,
            detail=f"Upload exceeds limit ({lim // (1024 * 1024)} MiB). Tune GENEZAP_MAX_UPLOAD_MB.",
        )
    try:
        payload = analyze_sequence_bytes(raw, pitch_demo=pitch_demo, use_integrated_real=use_integrated_real)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e)) from e
    except Exception as e:  # noqa: BLE001
        log.exception("Analyze failed")
        raise HTTPException(status_code=500, detail=str(e)) from e
    return AnalyzeResponse(**payload)
