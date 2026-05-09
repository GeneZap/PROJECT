# GeneZap: Integrated AMR Pipeline — Model Audit, Safety, and Training Guide

## 🧬 Project Purpose & Clinical Context

GeneZap is a next-generation, fully offline clinical decision support tool for rapid bacterial pathogen identification and antimicrobial resistance (AMR) profiling. It processes raw genetic sequencer files (FASTA/FNA) to deliver actionable, high-confidence recommendations for clinicians, while ensuring patient data never leaves the local environment.

---

## ⚙️ Integrated Pipeline Overview

The pipeline combines four specialized AI engines for robust, multi-modal analysis:

| Engine | Modality | Output |
| :--- | :---: | :--- |
| **V1 — Genomic Profiler** | 📊 NLP/Text | Species ID via K-mer indexing (>97% confidence) |
| **V2 — Pharmacology** | 💊 ML | Resistance/susceptibility for 51 antibiotics |
| **V3 — Vision Analyzer** | 🖼️ CV | CGR image + CNN for visual anomaly detection |
| **V4 — Gene Discovery** | 🔬 DB Alignment | CARD database gene validation (e.g., NDM-1) |

**Pipeline Logic:**
1. Input: .fna file (DNA sequence)
2. V1: Predicts bacterial species
3. V2: Predicts antibiotic resistance profile
4. V3: Generates CGR image, CNN predicts resistance visually
5. V4: Detects resistance genes via CARD database
6. Cross-validates results, flags new genes, and outputs a unified report

---

## 🔒 Offline & Security Features
- Entire pipeline runs locally; no data leaves the system
- No cloud or external server dependencies
- Designed for clinical safety and privacy compliance

---

## 🛡️ Model Audit & Safety Practices
- **Stratified train-test splits** for balanced evaluation
- **Class weights** and **SMOTE** to address class imbalance
- **Comprehensive metrics:** F1-Score, Precision, Recall, Confusion Matrix, Sensitivity, False Negative Rate
- **Threshold adjustment** for optimal FNR/FPR tradeoff
- **Confusion matrix** and per-class performance reporting
- **Audit logs** and this guide are maintained for transparency

---

## 📝 Example Integrated Report Output

```
=== INTEGRATED AMR PIPELINE REPORT ===
V1 Bacteria: Salmonella enterica
V3 Bacteria: Salmonella enterica
Bacteria ID Match: True
V3 Gene: blaCTX-M-15
Gene Verified by V4 (CARD): True
Recommended Antibiotics: ciprofloxacin, cefotaxime
```

---

## 🏗️ Training & Testing Workflow

1. **Locate scripts** in their respective model folders (e.g., V2_Model, V3_CNN MODEL TRAINING)
2. **Run training** with stratified splits and class weights enabled
3. **Evaluate** using all provided metrics (not just accuracy)
4. **Adjust thresholds** as needed for best clinical safety
5. **Test** on both balanced and imbalanced sets
6. **Refer to this guide** and AUDIT_REPORT_CRITICAL_FINDINGS.txt for best practices

---

## 📁 Key Files & Folders
- `INTEGRATED_AMR_PIPELINE_REAL.py` — Main offline pipeline
- `INTEGRATED_AMR_PIPELINE.py` — Template/logic reference
- `V1_Model_Output/`, `V2_Model_Output/`, `V3_Model_Output/`, `V4_GENE_DETECTION/` — Model outputs and detection modules
- `bacterial_dna/` — Sample input files
- `AUDIT_REPORT_CRITICAL_FINDINGS.txt` — Full audit log

---

## 🛠️ Troubleshooting & FAQ
- **Q:** Error: "Wrong file type"?  
  **A:** Only `.fna` files are accepted as input.
- **Q:** Model not found?  
  **A:** Ensure all `.pkl` and `.h5` model files are present in their respective folders.
- **Q:** Environment issues?  
  **A:** Use Python 3.10+, install all requirements, and check for correct folder structure.

---

**Maintained by: GitHub Copilot (April 2026)**
