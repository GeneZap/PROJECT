"""GeneZap FastAPI server — genome analysis and engine consensus."""

from __future__ import annotations

from typing import Any

from fastapi import FastAPI, File, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict

from analysis import analyze_sequence_bytes

app = FastAPI(title="GeneZap API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
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


@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze(
    file: UploadFile = File(...),
    pitch_demo: bool = Query(
        False,
        description="Return fully populated Salmonella MDR pitch JSON (keeps real assembly metrics).",
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
    try:
        payload = analyze_sequence_bytes(raw, pitch_demo=pitch_demo)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e)) from e
    except Exception as e:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=str(e)) from e
    return AnalyzeResponse(**payload)
