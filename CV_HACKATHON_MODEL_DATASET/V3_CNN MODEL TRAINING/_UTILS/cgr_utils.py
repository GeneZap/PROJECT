import numpy as np
import os
import tempfile
from PIL import Image

def generate_cgr_image(seq, out_path, size=256, dpi=100, color='cyan', bg='black'):
    """Generate CGR image with frequency-aware intensity mapping.

    Uses a hit-count heatmap rather than binary on/off pixels so repeated
    sequence patterns are preserved for the classifier.
    """
    coords = {'A': (0, 0), 'T': (1, 0), 'G': (1, 1), 'C': (0, 1)}

    # Parse a bounded prefix for predictable runtime.
    max_bases = 50000
    pos = np.array([0.5, 0.5], dtype=np.float64)
    hit_map = np.zeros((size, size), dtype=np.float32)

    for base in seq[:max_bases]:
        if base in coords:
            pos = (pos + np.array(coords[base], dtype=np.float64)) / 2
            x = int(pos[0] * size)
            y = int(pos[1] * size)
            x = max(0, min(size - 1, x))
            y = max(0, min(size - 1, y))
            hit_map[y, x] += 1.0

    if hit_map.max() == 0:
        # Fallback for empty/invalid sequences.
        hit_map[size // 2, size // 2] = 1.0

    # Log-normalization keeps dense hot-spots while preserving weak signal.
    heat = np.log1p(hit_map)
    heat /= (heat.max() + 1e-8)

    # Create RGB image array filled with background color.
    bg_colors = {'black': (0, 0, 0), 'white': (255, 255, 255), 'blue': (0,0, 255)}
    bg_rgb = bg_colors.get(bg.lower(), (0, 0, 0))
    img_array = np.full((size, size, 3), bg_rgb, dtype=np.uint8)

    # Convert color name to RGB.
    color_map = {'cyan': (0, 255, 255), 'blue': (0, 0, 255), 'red': (255, 0, 0), 'white': (255, 255, 255)}
    rgb_color = color_map.get(color.lower(), (0, 255, 255))

    # Blend foreground color intensity according to heat map.
    fg = np.array(rgb_color, dtype=np.float32).reshape(1, 1, 3)
    bg_arr = np.array(bg_rgb, dtype=np.float32).reshape(1, 1, 3)
    heat_3d = heat[:, :, None]
    blended = bg_arr + (fg - bg_arr) * heat_3d
    img_array = np.clip(blended, 0, 255).astype(np.uint8)

    # Save atomically to avoid partially-written files during inference.
    try:
        img = Image.fromarray(img_array, "RGB")
        out_dir = os.path.dirname(os.path.abspath(out_path)) or os.getcwd()
        os.makedirs(out_dir, exist_ok=True)

        with tempfile.NamedTemporaryFile(delete=False, suffix=".png", dir=out_dir) as tmp:
            temp_path = tmp.name
        img.save(temp_path, format="PNG")
        os.replace(temp_path, out_path)

        # Verify file was created.
        if not os.path.exists(out_path) or os.path.getsize(out_path) == 0:
            raise ValueError(f"Image file not created or is empty: {out_path}")

    except Exception as e:
        raise e

    return out_path


# --- CLI entrypoint for debugging ---
if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Generate CGR image from .fna file for debugging.")
    parser.add_argument('--fna', type=str, required=True, help='Path to .fna file')
    parser.add_argument('--out', type=str, required=True, help='Output PNG path')
    parser.add_argument('--size', type=int, default=256, help='Image size (default: 256)')
    parser.add_argument('--dpi', type=int, default=100, help='DPI (default: 100)')
    parser.add_argument('--color', type=str, default='cyan', help='Dot color (default: cyan)')
    parser.add_argument('--bg', type=str, default='black', help='Background color (default: black)')
    args = parser.parse_args()
    with open(args.fna, 'r', encoding='utf-8', errors='ignore') as f:
        seq = "".join([line.strip() for line in f if not line.startswith(">")]).upper()
    generate_cgr_image(seq, args.out, size=args.size, dpi=args.dpi, color=args.color, bg=args.bg)
    print(f"CGR image generated: {args.out}")
