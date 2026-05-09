import os
import pandas as pd
from _UTILS.cgr_utils import generate_cgr_image

# --- PATHS ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(os.path.join(BASE_DIR, ".."))
DNA_DIR = os.path.join(project_root, "bacterial_dna") # Folder containing .fna files
DATASET_PATH = os.path.join(project_root, "DATASET") # CSV with Genome ID and Resistant Phenotype
CSV_PATH = os.path.join(DATASET_PATH, "MASTER_TRAINING_LABELS.csv") # CSV with Genome ID and Resistant Phenotype
OUTPUT_BASE = os.path.join(BASE_DIR, "CNN_CGR_DATASET_FIXED")

os.makedirs(os.path.join(OUTPUT_BASE, "RESISTANT"), exist_ok=True)
os.makedirs(os.path.join(OUTPUT_BASE, "SUSCEPTIBLE"), exist_ok=True)

for class_dir in ["RESISTANT", "SUSCEPTIBLE"]:
    class_path = os.path.join(OUTPUT_BASE, class_dir)
    for f in os.listdir(class_path):
        if f.lower().endswith('.png'):
            os.remove(os.path.join(class_path, f))

print("⚙️ Booting HD Dataset Generator...")

try:
    labels_df = pd.read_csv(CSV_PATH, low_memory=False)
    labels_df.columns = labels_df.columns.str.strip()
    label_map = dict(zip(labels_df['Genome ID'].astype(str), labels_df['Resistant Phenotype'].astype(str).str.lower()))
    print(f"✅ Loaded {len(label_map)} labels.")
except Exception as e:
    print(f"❌ Error reading CSV: {e}")
    exit()

def extract_sequence_prefix(fna_path, max_bases=50000):
    chunks = []
    current_len = 0
    with open(fna_path, 'r', encoding='utf-8', errors='ignore') as f:
        for line in f:
            if line.startswith(">"):
                continue
            seq_line = line.strip().upper()
            if not seq_line:
                continue
            needed = max_bases - current_len
            if needed <= 0:
                break
            if len(seq_line) > needed:
                seq_line = seq_line[:needed]
            chunks.append(seq_line)
            current_len += len(seq_line)
    return "".join(chunks)

print("🚀 Generating frequency-aware CGR images...")
processed = 0

for filename in os.listdir(DNA_DIR):
    if filename.endswith(".fna"):
        genome_id = filename.replace(".fna", "")
        phenotype = label_map.get(genome_id, "unknown")
        
        if "resist" in phenotype:
            save_dir = os.path.join(OUTPUT_BASE, "RESISTANT")
        elif "suscept" in phenotype:
            save_dir = os.path.join(OUTPUT_BASE, "SUSCEPTIBLE")
        else:
            continue 
            
        save_path = os.path.join(save_dir, f"{genome_id}.png")

        seq = extract_sequence_prefix(os.path.join(DNA_DIR, filename), max_bases=50000)
        generate_cgr_image(seq, save_path, size=256, color='cyan', bg='black')
        processed += 1
        if processed % 50 == 0: print(f"  ... Generated {processed} HD images ...")

print(f"✅ Done! {processed} training images saved to {OUTPUT_BASE}")