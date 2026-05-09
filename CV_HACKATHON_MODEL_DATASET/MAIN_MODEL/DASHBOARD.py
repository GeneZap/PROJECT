import os
import warnings

# --- 0. SILENCE WARNINGS ---
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3' 
warnings.filterwarnings('ignore')

import joblib
import pandas as pd
import numpy as np
import tensorflow as tf
from collections import Counter
import matplotlib.pyplot as plt
from tensorflow.keras.preprocessing import image

# --- 1. PATHING SETUP ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(os.path.join(BASE_DIR, ".."))

V1_DIR = os.path.join(project_root, 'V1_Model_Output')
V2_DIR = os.path.join(project_root, 'V2_Model_Output')
# Pointing directly to your NEW HD Vision Model
V3_DIR = r"d:\CV_HACKATHON_MODEL_DATASET\V3_CNN MODEL TRAINING\V3_Model_Output"
CARD_FASTA = os.path.join(project_root, 'CARD_DB.fasta')

# --- 2. LOAD ALL MODELS ---
print("\n" + "═"*70)
print(" ⚙️  BOOTING QUAD-ENGINE CLINICAL AI SUITE...")
print("═"*70)

try:
    # LOAD V1 
    v1_model = joblib.load(os.path.join(V1_DIR, 'antibiotic_strength_model.pkl'))
    v1_features = joblib.load(os.path.join(V1_DIR, 'v1_feature_columns.pkl'))
    try: v1_scaler = joblib.load(os.path.join(V1_DIR, 'v1_scaler.pkl'))
    except: v1_scaler = None

    # LOAD V2 
    v2_model = joblib.load(os.path.join(V2_DIR, 'v2_multi_input_model.pkl'))
    v2_features = joblib.load(os.path.join(V2_DIR, 'v2_feature_columns.pkl'))
    
    # LOAD V3
    v3_model = tf.keras.models.load_model(os.path.join(V3_DIR, 'v3_vision_model.h5'))
    
    print(" ✅ All Neural, Mathematical, and Vision Engines Online.\n")
except Exception as e:
    print(f" ❌ CRITICAL BOOT ERROR: Could not load models. \nDetails: {e}")
    exit()

# --- 3. USER INPUT ---
patient_file = input(" 🧬 Drag Patient DNA (.fna) here: ").strip().strip('"').strip("'")
drug_name = input(" 💊 Enter Antibiotic to Test: ").strip()

print("\n 🔬 Sequencing Raw DNA File & Extracting Genomic Matrix...")
try:
    with open(patient_file, 'r', encoding='utf-8', errors='ignore') as f:
        sequence = "".join([line.strip() for line in f if not line.startswith(">")]).upper()
except Exception as e:
    print(f" ❌ Error reading DNA file: {e}")
    exit()

# Extract K-mers once for all mathematical engines
kmers = [sequence[i:i+6] for i in range(len(sequence) - 6 + 1)]
counts = Counter(kmers)

# =====================================================================
# ENGINE 1: V1 GENOMIC PROFILER (Species ID + ML Baseline)
# =====================================================================
seq_length = len(sequence)
gc_count = sequence.count('G') + sequence.count('C')
gc_content = (gc_count / seq_length) * 100 if seq_length > 0 else 0

if 32 <= gc_content <= 35: species_guess = "Staphylococcus aureus"
elif 38 <= gc_content <= 42: species_guess = "Acinetobacter baumannii"
elif 48 <= gc_content <= 53.5: species_guess = "Escherichia coli / Salmonella"
elif 55 <= gc_content <= 59: species_guess = "Klebsiella pneumoniae"
elif 65 <= gc_content <= 69: species_guess = "Pseudomonas aeruginosa"
else: species_guess = "Unknown Pathogen Strain"

test_row_v1 = [counts.get(col_name, 0) for col_name in v1_features]
test_df_v1 = pd.DataFrame([test_row_v1], columns=v1_features)

if v1_scaler is not None:
    test_df_v1 = pd.DataFrame(v1_scaler.transform(test_df_v1), columns=v1_features)

v1_raw_prediction = v1_model.predict(test_df_v1)[0]
v1_verdict = "RESISTANT" if v1_raw_prediction == 1 else "SUSCEPTIBLE"

# =====================================================================
# ENGINE 2: V2 GENOMIC FUSION (K-mer Mathematics)
# =====================================================================
test_row_v2 = [counts.get(col_name, 0) for col_name in v2_features]
test_df_v2 = pd.DataFrame([test_row_v2], columns=v2_features)

v2_prediction = v2_model.predict(test_df_v2)[0]
v2_verdict = "RESISTANT" if v2_prediction == 1 else "SUSCEPTIBLE"

# =====================================================================
# ENGINE 3: V3 VISION ANALYZER (HD CGR CNN)
# =====================================================================
temp_cgr = "cgr_display.png" 
coords = {'A': [0,0], 'T': [1,0], 'G': [1,1], 'C': [0,1]}
pos = np.array([0.5, 0.5])
points = []

for base in sequence[:50000]: 
    if base in coords:
        pos = (pos + np.array(coords[base])) / 2
        points.append(pos)
points = np.array(points)

plt.figure(figsize=(5, 5), dpi=100, facecolor='black')
plt.scatter(points[:, 0], points[:, 1], s=0.5, c='cyan', alpha=0.9, marker='.')
plt.axis('off')
plt.savefig(temp_cgr, bbox_inches='tight', pad_inches=0, facecolor='black')
plt.close()

# Locked to 256 HD architecture
img = image.load_img(temp_cgr, target_size=(256, 256)) 
img_array = image.img_to_array(img) / 255.0
img_array = np.expand_dims(img_array, axis=0)

prediction_prob = v3_model.predict(img_array, verbose=0)[0][0]

if prediction_prob < 0.50: 
    v3_verdict = "RESISTANT"
    v3_conf = (1 - prediction_prob) * 100
    v3_motif = "Beta-Lactamase / Plasmid structural signature"
else:
    v3_verdict = "SUSCEPTIBLE"
    v3_conf = prediction_prob * 100
    v3_motif = "Standard chromosomal baseline"

if os.path.exists(temp_cgr): os.remove(temp_cgr)

# =====================================================================
# ENGINE 4: V4 DISCOVERY SCANNER (CARD DB Ontology)
# =====================================================================
detected_genes = []
anomaly_found = False

def classify_gene_type(gene_name):
    name = gene_name.lower()
    if any(x in name for x in ['bla', 'ndm', 'kpc', 'oxa', 'ctx', 'vim']): return "Beta-Lactamase"
    if 'tet' in name: return "Tetracycline Resistance"
    if 'mec' in name: return "Methicillin Resistance"
    if 'sul' in name: return "Sulfonamide Resistance"
    if any(x in name for x in ['qnr', 'gyr', 'par']): return "Fluoroquinolone"
    if 'mcr' in name: return "Colistin Resistance"
    if any(x in name for x in ['aac', 'ant', 'aph', 'aad']): return "Aminoglycoside"
    return "Acquired Resistance Mechanism"

def get_reverse_complement(seq):
    complement = {'A': 'T', 'T': 'A', 'C': 'G', 'G': 'C'}
    return "".join(complement.get(base, base) for base in reversed(seq))

def load_card_database(filepath):
    db = {}
    try:
        with open(filepath, 'r') as f:
            current_header, current_seq = "", []
            for line in f:
                line = line.strip()
                if line.startswith(">"):
                    if current_header: db[current_header] = "".join(current_seq)
                    current_header = line
                    current_seq = []
                else:
                    current_seq.append(line)
            if current_header: db[current_header] = "".join(current_seq)
        return db
    except FileNotFoundError:
        return None

card_db = load_card_database(CARD_FASTA)
unique_genes_dict = {}

if card_db:
    for header, gene_sequence in card_db.items():
        if len(gene_sequence) > 60:
            forward_snippet = gene_sequence[:60]
            reverse_snippet = get_reverse_complement(forward_snippet)
            
            if forward_snippet in sequence or reverse_snippet in sequence:
                parts = header.split("|")
                gene_name = parts[-1] if len(parts) > 1 else header.replace(">", "")
                
                aro_id = "ARO:Unknown"
                for part in parts:
                    if "ARO:" in part: aro_id = part; break
                
                clean_name = gene_name.split("[")[0].strip() 
                gene_class = classify_gene_type(clean_name)
                detected_genes.append((clean_name, aro_id, gene_class))

if detected_genes:
    anomaly_found = True
    unique_genes_dict = {g[0]: g for g in detected_genes} 


# =====================================================================
# FINAL MULTI-MODAL DIAGNOSTIC DASHBOARD (THE MASTER REPORT)
# =====================================================================
print("\n")
print("╔════════════════════════════════════════════════════════════════════════╗")
print("║               🧬 COMPREHENSIVE CLINICAL DIAGNOSTIC REPORT              ║")
print("╠════════════════════════════════════════════════════════════════════════╣")
print(f"║ PATIENT GENOME : {seq_length:,} base pairs")
print(f"║ DRUG TARGET    : {drug_name.upper()}")
print("╠════════════════════════════════════════════════════════════════════════╣")
print("║ [ 1. BIOLOGICAL & IDENTITY PROFILE ]")
print(f"║  ▶ GC Content  : {gc_content:.2f}%")
print(f"║  ▶ Species ID  : {species_guess}")
print("║")
print("║ [ 2. NEURAL & MATHEMATICAL ENGINES ]")
print(f"║  ▶ Engine V1 (Generic ML)   : {'🚨 RESISTANT' if v1_verdict == 'RESISTANT' else '🟢 SUSCEPTIBLE'}")
print(f"║  ▶ Engine V2 (K-mer Fusion) : {'🚨 RESISTANT' if v2_verdict == 'RESISTANT' else '🟢 SUSCEPTIBLE'}")
print(f"║  ▶ Engine V3 (Vision CNN)   : {'🚨 RESISTANT' if v3_verdict == 'RESISTANT' else '🟢 SUSCEPTIBLE'} ({v3_conf:.1f}% Confidence)")
print(f"║      └─ Visual Motif: {v3_motif}")
print("║")
print("║ [ 3. ONTOLOGY & DATABASE SCAN (V4) ]")
if anomaly_found:
    print(f"║  ▶ ⚠️ CRITICAL ALIGNMENT: {len(unique_genes_dict)} Resistance Genes Detected!")
    for i, (name, data) in enumerate(list(unique_genes_dict.items())[:4]): 
        gene_name, aro, g_type = data
        print(f"║      {i+1}. [{aro}] {gene_name} | Class: {g_type}")
    if len(unique_genes_dict) > 4:
        print(f"║      ... and {len(unique_genes_dict) - 4} more variants.")
else:
    print("║  ▶ ✅ CARD Database Scan Clear: No known resistance mechanisms found.")
print("╠════════════════════════════════════════════════════════════════════════╣")

# DEMOCRATIC RISK SCORING
risk_score = 0
if v1_verdict == "RESISTANT": risk_score += 1
if v2_verdict == "RESISTANT": risk_score += 1
if v3_verdict == "RESISTANT": risk_score += 1
if anomaly_found: risk_score += 2 # V4 finding a gene is heavy evidence

if risk_score >= 3:
    print(f"║ ❌ FINAL CLINICAL VERDICT: HIGH RISK / CONTRAINDICATED               ")
    print(f"║    Do not prescribe {drug_name.upper()}. Isolate patient and consult ID. ")
else:
    print(f"║ ✅ FINAL CLINICAL VERDICT: LOW RISK / VIABLE                         ")
    print(f"║    {drug_name.upper()} is cleared for standard prescription protocol.")
print("╚════════════════════════════════════════════════════════════════════════╝\n")