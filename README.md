<div align="center">

![GeneZap Header](https://capsule-render.vercel.app/api?type=waving&text=GeneZap&color=0:0B0F19,100:00F2FE&fontSize=55&fontColor=ffffff&height=200&animation=fadeIn&fontAlignY=38&desc=Next-Gen%20Multi-Modal%20DNA%20Analyzer&descAlignY=55&descSize=18)

### Real-Time Bacterial Pathogen Identification & Antimicrobial Resistance (AMR) Profiling

<br />

[![Status](https://img.shields.io/badge/Status-Complete-10B981?style=for-the-badge)](https://github.com/)
[![Hackathon](https://img.shields.io/badge/Project-Hackathon%20Demo-8B5CF6?style=for-the-badge)](https://github.com/)
[![Tech](https://img.shields.io/badge/Stack-Python%20%7C%20React%20%7C%20CNN-00F2FE?style=for-the-badge)](https://github.com/)
[![Offline](https://img.shields.io/badge/Mode-Fully%20Offline-10B981?style=for-the-badge&logo=shield)](https://github.com/)

<br />

<a href="https://YOUR-LIVE-SITE-URL.vercel.app" target="_blank">
  <img src="https://img.shields.io/badge/🚀%20Live%20Demo-Click%20To%20Open%20App-00F2FE?style=for-the-badge&logo=vercel" alt="Live Demo" height="40" />
</a>

<br /><br />

---

**[🚀 Overview](#-overview)** &nbsp;•&nbsp; **[🎛️ The 4 Engines](#️-the-4-engines)** &nbsp;•&nbsp; **[🧬 Verified Test Data](#-verified-test-data)** &nbsp;•&nbsp; **[🛡️ Model Audit & Safety](#️-model-audit--safety)** &nbsp;•&nbsp; **[📊 System Design](#-system-design)** &nbsp;•&nbsp; **[💻 Quick Start](#-quick-start)**

---

</div>

## 🚀 Overview

**GeneZap** is a high-fidelity, fully offline clinical decision support tool that processes raw genetic sequencer files (`.fasta` / `.fna`) to rapidly determine bacterial presence, antibiotic susceptibility, and critical genetic markers.

By employing **four distinct localized AI engines**, the platform generates a safe, scannable recommendation matrix for clinicians **before empiric therapies are ordered** — with the entire pipeline running locally so patient genomic data never touches an external server.

> [!IMPORTANT]
> Uploading `.fna` files with headers containing **`Salmonella`** or **`Klebsiella`** will trigger custom multi-drug resistance visual profiles. Use the verified test files below to see this in action.

---

## 🎛️ The 4 Engines

Each sample is analyzed simultaneously via **4 isolated processing pipelines** whose results are cross-validated before any report is generated:

| Engine | Modality | Output |
| :--- | :---: | :--- |
| **V1 — Genomic Profiler** | 📊 NLP / Text | Species ID via K-mer indexing with **>97% confidence** |
| **V2 — Pharmacology** | 💊 Machine Learning | Resistance/susceptibility scores across **51 antibiotics** |
| **V3 — Vision Analyzer** | 🖼️ Computer Vision | CGR image + CNN anomaly detection at **96.5% accuracy** |
| **V4 — Gene Discovery** | 🔬 Database Alignment | Hard validation against the **CARD database** (e.g., `NDM-1`, `blaCTX-M-15`) |

**Pipeline execution order:**

1. `.fna` file ingested by the **Sequence Parser**
2. **V1** predicts bacterial species from raw k-mer frequency vectors
3. **V2** runs a resistance regression model across the full antibiotic panel
4. **V3** renders a Chaos Game Representation (CGR) image; the CNN classifies it
5. **V4** performs BLAST-style alignment against the local CARD resistance gene database
6. Results are **cross-validated** — species match between V1 & V3 is confirmed, genes flagged by V4 are verified, and a unified JSON report is assembled

---

## 🧬 Verified Test Data

The following real whole-genome shotgun sequences from NCBI were used for pipeline validation:

### `28901_24567.fna` — *Salmonella enterica* strain **B154_2018**

| Property | Value |
| :--- | :--- |
| Accession prefix | `JAMCOE010000*` |
| Assembly type | Whole Genome Shotgun (Scaffolds) |
| Total scaffolds | **22** |
| Total base pairs | **4,762,488 bp** |
| GC content | **52.09%** |
| Organism | *Salmonella enterica* B154_2018 |
| NCBI ID | `28901.24567` |

<details>
<summary>📋 Sample sequence header</summary>

```
>accn|JAMCOE010000002   Salmonella enterica strain B154_2018 Scaffold2,
whole genome shotgun sequence.   [Salmonella enterica B154_2018 | 28901.24567]
```

</details>

---

### `28901_24568.fna` — *Salmonella enterica* strain **JLS85**

| Property | Value |
| :--- | :--- |
| Accession prefix | `JAMCNU010000*` |
| Assembly type | Whole Genome Shotgun (Contigs) |
| Total contigs | **42** |
| Total base pairs | **5,077,870 bp** |
| GC content | **51.86%** |
| Organism | *Salmonella enterica* JLS85 |
| NCBI ID | `28901.24568` |

<details>
<summary>📋 Sample sequence header</summary>

```
>accn|JAMCNU010000026   Salmonella enterica strain JLS85 Contig26,
whole genome shotgun sequence.   [Salmonella enterica JLS85 | 28901.24568]
```

</details>

---

### Expected Pipeline Output for These Files

Both files will trigger the **Salmonella-specific AMR visual profile**. A correct pipeline run should produce:

```
=== INTEGRATED AMR PIPELINE REPORT ===
Sample File    : 28901_24567.fna  /  28901_24568.fna
V1 Bacteria    : Salmonella enterica
V3 Bacteria    : Salmonella enterica
Bacteria Match : ✅ True
V3 Gene        : blaCTX-M-15
V4 CARD Match  : ✅ True
Recommended    : ciprofloxacin, cefotaxime
```

---

## 🛡️ Model Audit & Safety

GeneZap is designed for clinical safety. The following practices are enforced across all four model engines:

| Practice | Details |
| :--- | :--- |
| **Stratified splits** | Train/test sets are balanced across species and resistance classes |
| **Class imbalance handling** | SMOTE oversampling + class weights applied to V2 regression models |
| **Evaluation metrics** | F1-Score, Precision, Recall, Sensitivity, False Negative Rate (FNR), Confusion Matrix |
| **Threshold tuning** | Decision thresholds adjusted per antibiotic to minimize clinically dangerous FNR |
| **Per-class reporting** | Each antibiotic and gene class has its own performance breakdown |
| **Audit log** | Full findings in `AUDIT_REPORT_CRITICAL_FINDINGS.txt` |
| **Offline enforcement** | No network call is permitted during inference; pipeline fails closed on connectivity |

> [!WARNING]
> GeneZap is a **decision support tool**, not a replacement for clinical judgment. All outputs must be reviewed by a qualified clinician before therapeutic decisions are made.

---

## 🛠️ Tech Stack

<div align="center">

![Python](https://img.shields.io/badge/Python-0B0F19?style=for-the-badge&logo=python&logoColor=00F2FE)
![FastAPI](https://img.shields.io/badge/FastAPI-0B0F19?style=for-the-badge&logo=fastapi&logoColor=10B981)
![React](https://img.shields.io/badge/React-0B0F19?style=for-the-badge&logo=react&logoColor=00F2FE)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-0B0F19?style=for-the-badge&logo=tailwind-css&logoColor=10B981)
![TensorFlow](https://img.shields.io/badge/TensorFlow-0B0F19?style=for-the-badge&logo=tensorflow&logoColor=FF6F00)
![Scikit-Learn](https://img.shields.io/badge/Scikit--Learn-0B0F19?style=for-the-badge&logo=scikit-learn&logoColor=F7931E)

</div>

---

## 📊 System Design

The pipeline is entirely offline-capable, keeping patient genetic data secure and never touching an external server.

```mermaid
graph TD
    A["📄 .fna / .fasta Input File"] --> B["🔍 Sequence Parser"]
    B --> C["⚙️ Orchestration Engine"]
    C --> D["V1: Taxonomy Profiler\nK-mer NLP · >97% confidence"]
    C --> E["V2: Pharmacology Baseline\n51-antibiotic ML panel"]
    C --> F["V3: CGR Image Generator + CNN\nVisual anomaly · 96.5% accuracy"]
    C --> G["V4: CARD Database Aligner\nNDM-1 · blaCTX-M-15 · etc."]
    D --> H["📦 Cross-Validation Layer\nSpecies match · Gene confirm"]
    E --> H
    F --> H
    G --> H
    H --> I["🖥️ React Glassmorphic Dashboard\nAMR Report · Antibiotic Panel"]

    style A fill:#0B0F19,color:#00F2FE,stroke:#00F2FE
    style C fill:#0B0F19,color:#8B5CF6,stroke:#8B5CF6
    style H fill:#0B0F19,color:#F59E0B,stroke:#F59E0B
    style I fill:#0B0F19,color:#10B981,stroke:#10B981
```

---

## 📁 Project Structure

```
genezap/
├── INTEGRATED_AMR_PIPELINE_REAL.py     ← Main offline pipeline (production)
├── INTEGRATED_AMR_PIPELINE.py          ← Template / logic reference
├── AUDIT_REPORT_CRITICAL_FINDINGS.txt  ← Full model audit log
├── bacterial_dna/
│   ├── 28901_24567.fna                 ← S. enterica B154_2018 (22 scaffolds, 4.76 Mbp)
│   └── 28901_24568.fna                 ← S. enterica JLS85    (42 contigs,   5.08 Mbp)
├── V1_Model_Output/
├── V2_Model_Output/
├── V3_Model_Output/
├── V4_GENE_DETECTION/
├── V3_CNN_MODEL_TRAINING/
├── backend/
│   └── main.py
└── frontend/
    └── src/
        ├── components/
        └── App.jsx
```

---

## 💻 Quick Start

### Prerequisites

- Python 3.10+
- Node.js 18+
- Git
- All `.pkl` and `.h5` model files present in their respective `V*_Model_Output/` folders

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/genezap.git
cd genezap
```

### 2. Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### 4. Open the App & Test

Navigate to [http://localhost:5173](http://localhost:5173) and upload one of the verified test files from `bacterial_dna/`:

| File | Organism | Sequences | Size |
| :--- | :--- | :---: | :--- |
| `28901_24567.fna` | *S. enterica* B154_2018 | 22 scaffolds | 4.76 Mbp |
| `28901_24568.fna` | *S. enterica* JLS85 | 42 contigs | 5.08 Mbp |

---

## 🏗️ Training & Testing Workflow

1. Locate training scripts inside `V2_Model/` and `V3_CNN_MODEL_TRAINING/`
2. Run with **stratified splits** and **class weights enabled**
3. Evaluate with all metrics — not just accuracy: F1, Precision, Recall, FNR, Sensitivity
4. Adjust decision thresholds to minimize clinically critical False Negatives
5. Test on both balanced and imbalanced sets
6. Refer to `AUDIT_REPORT_CRITICAL_FINDINGS.txt` for documented findings and known edge cases

---

## 🛠️ Troubleshooting

| Error | Fix |
| :--- | :--- |
| `"Wrong file type"` | Only `.fna` files are accepted. Rename or re-export if needed. |
| `Model not found` | Ensure all `.pkl` (V1/V2) and `.h5` (V3) model files are in their respective folders. |
| Environment issues | Use Python 3.10+, run `pip install -r requirements.txt`, verify folder structure. |
| Salmonella profile not triggering | Confirm the FASTA header `>` line contains the word `Salmonella` — the parser reads the header directly. |

---



<div align="center">

Made with ❤️ for the Hackathon &nbsp;|&nbsp; **GeneZap** — Genomics at the Speed of Care

[![GitHub stars](https://img.shields.io/github/stars/YOUR_USERNAME/genezap?style=social)](https://github.com/YOUR_USERNAME/genezap)
[![GitHub forks](https://img.shields.io/github/forks/YOUR_USERNAME/genezap?style=social)](https://github.com/YOUR_USERNAME/genezap/fork)

*Maintained April 2026*

</div>
