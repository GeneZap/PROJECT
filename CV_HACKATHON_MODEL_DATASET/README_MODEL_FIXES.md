# Model Audit Fixes & Training Tools

This file documents the critical fixes applied to all model training scripts and the organization of training tools for future testing and retraining.

## Summary of Fixes (per AUDIT_REPORT_CRITICAL_FINDINGS.txt)

### 1. Data Balancing
- Applied **stratified train-test split** to maintain class distribution in both sets.
- Used **class_weight='balanced'** and/or **SMOTE** (where feasible) to address class imbalance.

### 2. Training Modifications
- All main training scripts now use stratified splits.
- Class weights for 'Resistant' increased where possible.
- Sample weighting added for imbalanced classes.

### 3. Evaluation Metrics
- Accuracy is no longer the only metric.
- All scripts now output **F1-Score, Precision, Recall, Confusion Matrix, False Negative Rate, Sensitivity**.

### 4. Model Testing
- Scripts include code to generate confusion matrices and per-class performance.
- Test sets are stratified; option to test on balanced/imbalanced sets.

### 5. Prediction Threshold
- Scripts allow for threshold adjustment (not just default 0.5).
- Guidance included for optimizing threshold based on FNR/FPR tradeoff.

## Training Tools Organization
- All main training scripts are in their respective model folders (V2_Model, V3_CNN MODEL TRAINING, etc.).
- Only essential scripts and model artifacts are kept; all temp/test/old files will be removed.
- This README and AUDIT_REPORT_CRITICAL_FINDINGS.txt are preserved for reference.

## Next Steps
- Test each model using the provided scripts.
- Adjust thresholds and retrain as needed for best medical safety.
- Refer to this README for a summary of all fixes and workflow.

---

**Maintained by: GitHub Copilot (April 2026)**
