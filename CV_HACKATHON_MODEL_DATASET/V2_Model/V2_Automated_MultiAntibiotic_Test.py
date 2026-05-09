"""
V2 Automated Multi-Antibiotic Testing Script
------------------------------------------------
This script tests the fixed V2 multi-input model on a given .fna file for all antibiotics supported by the model.
It outputs predictions for each antibiotic and summarizes the results.

Usage:
    python V2_Automated_MultiAntibiotic_Test.py <path_to_fna_file>

Requirements:
    - V2_Model_Output/v2_multi_input_model_FIXED.pkl
    - V2_Model_Output/v2_feature_columns_FIXED.pkl
    - V2_Model/v2_kmer_extractor.py (or equivalent k-mer extraction logic)
    - pandas, joblib, numpy, sklearn
"""
import sys
import os
import joblib
import pandas as pd
import numpy as np

# --- CONFIG ---
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.abspath(os.path.join(SCRIPT_DIR, '..', 'V2_Model_Output', 'v2_multi_input_model_FIXED.pkl'))
FEATURES_PATH = os.path.abspath(os.path.join(SCRIPT_DIR, '..', 'V2_Model_Output', 'v2_feature_columns_FIXED.pkl'))
KMER_EXTRACTOR_PATH = os.path.join(SCRIPT_DIR, 'v2_kmer_extractor.py')

# --- LOAD KMER EXTRACTOR ---
# If k-mer extraction is a function in v2_kmer_extractor.py, import it
try:
    from v2_kmer_extractor import extract_kmers_from_fna
except ImportError:
    def extract_kmers_from_fna(fna_path, k=6):
        # Minimal fallback: extract all k-mers from .fna file
        seq = ''
        with open(fna_path) as f:
            for line in f:
                if not line.startswith('>'):
                    seq += line.strip().upper()
        kmers = {}
        for i in range(len(seq) - k + 1):
            kmer = seq[i:i+k]
            if set(kmer) <= set('ACGT'):
                kmers[kmer] = kmers.get(kmer, 0) + 1
        return kmers

# --- MAIN ---
def main():
    default_fna = r'D:\CV_HACKATHON_MODEL_DATASET\bacterial_dna\28901.24566.fna'
    if len(sys.argv) == 2:
        fna_file = sys.argv[1]
    else:
        print(f'No .fna file argument provided. Using default: {default_fna}')
        fna_file = default_fna
    if not os.path.exists(fna_file):
        print(f'File not found: {fna_file}')
        sys.exit(1)


    # Load model and features
    model = joblib.load(MODEL_PATH)
    feature_columns = joblib.load(FEATURES_PATH)
    antibiotics = [col.replace('Drug_', '') for col in feature_columns if col.startswith('Drug_')]

    # Extract k-mers from .fna
    kmer_counts = extract_kmers_from_fna(fna_file)

    # --- Load training labels to validate which antibiotics are real for this genome ---
    labels_path = os.path.abspath(os.path.join(SCRIPT_DIR, '..', 'DATASET', 'MASTER_TRAINING_LABELS.csv'))
    genome_id = os.path.splitext(os.path.basename(fna_file))[0]
    # Remove any extension after . for genome id (e.g., 28901.24569)
    if '.' in genome_id:
        genome_id = genome_id
    valid_antibiotics = set()
    try:
        labels_df = pd.read_csv(labels_path, usecols=['Genome ID','Antibiotic'])
        valid_antibiotics = set(labels_df[labels_df['Genome ID'].astype(str) == genome_id]['Antibiotic'].str.strip().unique())
    except Exception as e:
        print(f'Warning: Could not load/parse MASTER_TRAINING_LABELS.csv for validation. {e}')

    results = []
    for ab in antibiotics:
        # Build feature vector for this antibiotic
        features = {col: 0 for col in feature_columns}
        # Set k-mer features
        for kmer, count in kmer_counts.items():
            if kmer in features:
                features[kmer] = count
        # Set drug one-hot
        drug_col = f'Drug_{ab}'
        if drug_col in features:
            features[drug_col] = 1
        # Convert to DataFrame
        X = pd.DataFrame([features])[feature_columns]
        # Predict
        pred = model.predict(X)[0]
        proba = model.predict_proba(X)[0]
        is_valid = ab in valid_antibiotics
        results.append({'Antibiotic': ab, 'Prediction': pred, 'Prob_Resistant': proba[1], 'Prob_Susceptible': proba[0], 'Validated': is_valid})

    # Output results
    df = pd.DataFrame(results)
    print('\nAutomated V2 Multi-Antibiotic Test Results:')
    print(df.to_string(index=False))
    # Save to CSV
    out_csv = os.path.splitext(os.path.basename(fna_file))[0] + '_V2_MultiAntibiotic_Predictions.csv'
    df.to_csv(out_csv, index=False)
    print(f'\nResults saved to: {out_csv}')

if __name__ == '__main__':
    main()
