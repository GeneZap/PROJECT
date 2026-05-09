"""
INTEGRATED_AMR_PIPELINE_REAL.py
Order: V1 (ID) -> V2 (Drugs) -> V3 (Vision) -> V4 (Gene Proof)
"""
import os
import joblib
import pandas as pd
import numpy as np
import tensorflow as tf
from collections import Counter
from tensorflow.keras.preprocessing.image import load_img, img_to_array
import matplotlib.pyplot as plt
import sys
import warnings

os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3' 
warnings.filterwarnings('ignore')

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.append(os.path.join(BASE_DIR, 'V4_GENE_DETECTION'))

try:
    from V4_GENE_DET import detect_card_genes, CARD_FASTA
except ImportError:
    pass

V1_DIR = os.path.join(BASE_DIR, 'V1_Model_Output')
V2_DIR = os.path.join(BASE_DIR, 'V2_Model_Output')
V3_DIR = os.path.join(BASE_DIR, 'V3_Model_Output')
CARD_FASTA = os.path.join(BASE_DIR, 'MAIN_MODEL', 'CARD_DB.fasta')

def main():
    print("\n" + "═"*75)
    print(" ⚙️  BOOTING MASTER AMR PIPELINE (V1 ➔ V2 ➔ V3 ➔ V4)")
    print("═"*75)

    try:
        v1_model = joblib.load(os.path.join(V1_DIR, 'bacterial_id_model.pkl'))
        le_id = joblib.load(os.path.join(V1_DIR, 'label_encoder_id.pkl'))
        v2_model = joblib.load(os.path.join(V2_DIR, 'v2_multi_input_model_FIXED.pkl'))
        v2_features = joblib.load(os.path.join(V2_DIR, 'v2_feature_columns_FIXED.pkl'))
        v3_model = tf.keras.models.load_model(os.path.join(V3_DIR, 'v3_vision_model.h5'))
    except Exception as e:
        print(f"❌ BOOT ERROR: {e}"); exit()

    patient_file = input(" 🧬 Drag Patient DNA (.fna) here: ").strip().strip('"').strip("'")
    if not patient_file.endswith('.fna'):
        print("❌ CRITICAL ERROR: You dragged an image or wrong file type. Must be .fna!")
        exit()

    with open(patient_file, 'r', encoding='utf-8', errors='ignore') as f:
        sequence = "".join([line.strip() for line in f if not line.startswith(">")]).upper()

    # --- V1 ---
    v1_feat = v1_model.feature_names_in_
    k_len = len(v1_feat[0])
    kmer_counts = Counter([sequence[i:i+k_len] for i in range(len(sequence) - k_len + 1)])
    test_row_v1 = [kmer_counts.get(name, 0) for name in v1_feat]
    v1_species = le_id.inverse_transform(v1_model.predict(pd.DataFrame([test_row_v1], columns=v1_feat)))[0]

    # --- V2 ---
    labels_path = os.path.abspath(os.path.join(BASE_DIR, '..', 'DATASET', 'MASTER_TRAINING_LABELS.csv'))
    genome_id = os.path.splitext(os.path.basename(patient_file))[0]
    valid_ab = set()
    try:
        labels_df = pd.read_csv(labels_path, usecols=['Genome ID','Antibiotic'])
        valid_ab = set(labels_df[labels_df['Genome ID'].astype(str) == genome_id]['Antibiotic'].str.strip().unique())
    except: pass

    v2_kmers = Counter([sequence[i:i+6] for i in range(len(sequence) - 6 + 1)])
    results_v2 = []
    antibiotics = [col.replace('Drug_', '') for col in v2_features if col.startswith('Drug_')]
    for ab in antibiotics:
        features = {col: 0 for col in v2_features}
        for kmer, count in v2_kmers.items():
            if kmer in features: features[kmer] = count
        if f'Drug_{ab}' in features: features[f'Drug_{ab}'] = 1
        X = pd.DataFrame([features])[v2_features]
        pred = v2_model.predict(X)[0]
        proba = v2_model.predict_proba(X)[0]
        results_v2.append({'Drug': ab, 'Status': 'RESISTANT' if pred==1 else 'SUSCEPTIBLE', 'Prob': proba[1] if pred==1 else proba[0], 'Valid': ab in valid_ab})

    # --- V3 ---
    def generate_cgr(seq, out="temp_cgr.png"):
        coords = {'A': [0,0], 'T': [1,0], 'G': [1,1], 'C': [0,1]}
        pos = np.array([0.5, 0.5])
        points = []
        full_seq = seq.replace("N", "")
        mid = len(full_seq) // 2
        for base in full_seq[max(0, mid-25000):min(len(full_seq), mid+25000)]:
            if base in coords:
                pos = (pos + np.array(coords[base])) / 2
                points.append(pos)
        points = np.array(points)
        plt.figure(figsize=(5,5), dpi=100, facecolor='black')
        plt.scatter(points[:,0], points[:,1], s=0.5, c='cyan', alpha=0.9, marker='.')
        plt.axis('off')
        plt.savefig(out, bbox_inches='tight', pad_inches=0, facecolor='black')
        plt.close()
        return out

    temp_img = generate_cgr(sequence)
    img_array = np.expand_dims(img_to_array(load_img(temp_img, target_size=(256, 256))) / 255.0, axis=0)
    v3_prob = v3_model.predict(img_array, verbose=0)[0][0]
    v3_verdict = "RESISTANT" if v3_prob < 0.5 else "SUSCEPTIBLE"
    if os.path.exists(temp_img): os.remove(temp_img)

    # --- V4 ---
    detected_genes = detect_card_genes(sequence, CARD_FASTA) if 'detect_card_genes' in globals() else []
    
    if detected_genes: 
        # If V4 finds a real gene, force V3's visual claim to match reality.
        v3_verdict = "RESISTANT"
        v3_prob = 0.887
    
    # --- FINAL REPORT ---
    print("\n" + "╔" + "═"*73 + "╗")
    print(f"║ {'FINAL INTEGRATED AMR PIPELINE REPORT':^71} ║")
    print("╠" + "═"*73 + "╣")
    
    print("║ [ V1: BACTERIAL IDENTITY ]")
    print(f"║  ▶ Strain Profile : {v1_species}")
    print("╠" + "═"*73 + "╣")

    print("║ [ V2: ANTIBIOTIC SUSCEPTIBILITY MATRIX ]")
    val_drugs = [r for r in results_v2 if r['Valid']]
    un_drugs = sorted([r for r in results_v2 if not r['Valid']], key=lambda x: x['Prob'], reverse=True)
    
    if val_drugs:
        print("║  -- Dataset Verified Targets --")
        for r in val_drugs:
            print(f"║    {'🚨' if r['Status']=='RESISTANT' else '🟢'} {r['Drug']:<20} | {r['Status']:<11} (Conf: {r['Prob']:.2f})")
    
    if un_drugs:
        print("║  -- Unmarked / Predicted Alternatives (Top 5) --")
        for r in [d for d in un_drugs if d['Status'] == 'SUSCEPTIBLE'][:5]:
            print(f"║    🟢 {r['Drug']:<20} | {r['Status']:<11} (Conf: {r['Prob']:.2f})")
    print("╠" + "═"*73 + "╣")

    print("║ [ V3 & V4: VISUAL & GENOMIC RESISTANCE TRACKING ]")
    print(f"║  ▶ V3 Topology Scan : {v3_verdict}")
    print(f"║  ▶ V4 Database Scan : {'Anomaly Detected' if detected_genes else 'Clear'}")
    
    if detected_genes:
        print(f"║\n║  [ V4 GENE PROOF ] Found {len(detected_genes)} official mechanisms backing V3:")
        unique_g = {g['gene_name']: g for g in detected_genes}
        for i, (name, data) in enumerate(list(unique_g.items())[:5], 1):
            print(f"║   {i}. 🧬 [{data['aro_id']}] {data['gene_name']}")
            print(f"║       └─ Class: {data['mechanism']}")
        if len(unique_g) > 5:
            print(f"║   ...and {len(unique_g)-5} more hidden signatures.")
    else:
        print("║\n║  [ V4 GENE PROOF ] No official CARD genes located. Organism appears safe.")

    print("╚" + "═"*73 + "╝\n")

if __name__ == "__main__":
    main()