import csv
import requests
import os
import time

# --- CONFIG ---
csv_file = "correct_BVBRC_genome_amr_1-200.csv"  # Ensure this file is in the same folder
output_folder = "bacterial_dna"

if not os.path.exists(output_folder):
    os.makedirs(output_folder)

# --- DOWNLOADER ---
try:
    with open(csv_file, mode='r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        
        if 'Genome ID' not in reader.fieldnames:
            print(f"Error: Could not find 'Genome ID' column. Found: {reader.fieldnames}")
            exit()

        # Get unique IDs
        genome_ids = set(row['Genome ID'] for row in reader if row['Genome ID'])
        print(f"Found {len(genome_ids)} unique genomes. Starting download...")

        for i, gid in enumerate(sorted(list(genome_ids))):
            save_path = os.path.join(output_folder, f"{gid}.fna")
            
            if os.path.exists(save_path):
                print(f"[{i+1}/{len(genome_ids)}] Skipping {gid} (Already exists)")
                continue

            # CORRECTED URL STRUCTURE
            base_url = "https://bv-brc.org"
            params = {
                "eq": f"(genome_id,{gid})",
                "limit": "25000",
                "http_accept": "application/vnd.fasta"
            }
            
            try:
                print(f"[{i+1}/{len(genome_ids)}] Downloading {gid}...", end=" ", flush=True)
                # We use params=params to let requests handle the URL encoding safely
                r = requests.get(base_url, params=params, timeout=60)
                
                if r.status_code == 200 and len(r.text) > 100:
                    with open(save_path, "w", encoding="utf-8") as out:
                        out.write(r.text)
                    print("SUCCESS")
                else:
                    print(f"FAILED (Status: {r.status_code})")
            except Exception as e:
                print(f"ERROR: {e}")
            
            # Small delay to prevent being blocked by the server
            time.sleep(0.5)

except FileNotFoundError:
    print(f"Error: Could not find '{csv_file}'!")
except Exception as e:
    print(f"An unexpected error occurred: {e}")

print("\nProcess finished! Check the 'bacterial_dna' folder.")