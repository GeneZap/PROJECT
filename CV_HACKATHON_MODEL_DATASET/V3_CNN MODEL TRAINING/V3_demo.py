import os
import warnings
import tempfile

# Silence warnings for a clean terminal
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3' 
warnings.filterwarnings('ignore')

import tensorflow as tf
from keras.utils import load_img, img_to_array
from _UTILS.cgr_utils import generate_cgr_image

# --- PATHING ---
script_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(os.path.join(script_dir, ".."))
# Make sure this path points exactly to where your new .h5 file is!
V3_PATH = os.path.join(project_root, 'V3_Model_Output', 'v3_vision_model.h5')

# --- LOAD VISION BRAIN ---
print("\n" + "="*50)
print("👁️ Booting V3 HD Vision Diagnostic Tool...")
print("="*50)
try:
    model = tf.keras.models.load_model(V3_PATH)
    print("✅ HD CNN Loaded Successfully.")
except Exception as e:
    print(f"❌ Error loading model: {e}")
    exit()

# --- TEST FUNCTION ---
def diagnose_dna_visually(fna_path):
    print(f"\n🔬 Scanning Topological Signature for: {os.path.basename(fna_path)}")
    
    # 1. Read DNA
    with open(fna_path, 'r', encoding='utf-8', errors='ignore') as f:
        seq = "".join([line.strip() for line in f if not line.startswith(">")]).upper()
    
    # 2. Generate CGR image using the same preprocessing as training/inference.
    with tempfile.NamedTemporaryFile(delete=False, suffix=".png", dir=script_dir) as tmp:
        temp_plot = tmp.name
    generate_cgr_image(seq, out_path=temp_plot, size=256, color='cyan', bg='black')
    
    # 3. Predict (Using the upgraded 256x256 resolution)
    img = load_img(temp_plot, target_size=(256, 256))
    img_array = img_to_array(img) / 255.0
    img_array = np.expand_dims(img_array, axis=0)
    
    prediction_prob = float(model.predict(img_array, verbose=0)[0][0])
    
    print("\n" + "="*40)
    print(f"🔬 VISION ANALYSIS REPORT")
    print("="*40)
    
    # Class Mapping Check: RESISTANT is 0, so closer to 0 = Resistant
    if prediction_prob < 0.50:
        confidence = (1 - prediction_prob) * 100
        print(f"RESULT: 🚨 RESISTANT PATTERN DETECTED")
        print(f"CONFIDENCE: {confidence:.2f}%")
        print(f"MOTIF: Beta-Lactamase / Plasmid structural signature")
    else:
        confidence = prediction_prob * 100
        print(f"RESULT: 🟢 SUSCEPTIBLE PATTERN DETECTED")
        print(f"CONFIDENCE: {confidence:.2f}%")
        print(f"MOTIF: Standard chromosomal baseline")
    print("="*40)
    
    # Clean up
    if os.path.exists(temp_plot):
        os.remove(temp_plot)

# --- EXECUTION ---
test_file = input("\n🧬 Drag an .fna file here to test V3 Vision: ").strip().strip('"').strip("'")
if os.path.exists(test_file):
    diagnose_dna_visually(test_file)
else:
    print("❌ File not found!")