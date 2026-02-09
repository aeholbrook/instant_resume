#!/usr/bin/env python3
"""
Balanced film carousel image processor:
- More conservative white edge removal
- Only targets obvious white borders
- Preserves film edge details
"""

import os
from PIL import Image
import numpy as np

def process_film_image(input_path, output_path):
    """
    Process a film image with balanced edge transparency.
    """
    # Open image and convert to RGBA
    img = Image.open(input_path).convert('RGBA')
    data = np.array(img)

    # Get image dimensions
    height, width = data.shape[:2]

    # Moderate edge region (outer 7% of image on each side)
    edge_width = int(width * 0.07)
    edge_height = int(height * 0.07)

    # Create a mask for edge regions
    edge_mask = np.zeros((height, width), dtype=bool)

    # Mark edge regions
    edge_mask[:edge_height, :] = True  # Top
    edge_mask[-edge_height:, :] = True  # Bottom
    edge_mask[:, :edge_width] = True  # Left
    edge_mask[:, -edge_width:] = True  # Right

    # Get RGB channels
    r, g, b, a = data[:,:,0], data[:,:,1], data[:,:,2], data[:,:,3]

    # Only target very white pixels (higher threshold)
    white_threshold = 245  # Only very white pixels
    is_white = (r > white_threshold) & (g > white_threshold) & (b > white_threshold)

    # Make only very white pixels in edge regions transparent
    make_transparent = is_white & edge_mask
    data[make_transparent, 3] = 0

    # Subtle fade for near-white edge pixels
    near_white_threshold = 238
    is_near_white = (r > near_white_threshold) & (g > near_white_threshold) & (b > near_white_threshold) & ~is_white
    make_faded = is_near_white & edge_mask

    if make_faded.any():
        # Gentle fade
        avg_rgb = (r[make_faded].astype(float) + g[make_faded].astype(float) + b[make_faded].astype(float)) / 3
        # Very gentle alpha reduction
        alpha_multiplier = np.clip((245 - avg_rgb) / 7, 0, 0.5)
        data[make_faded, 3] = (data[make_faded, 3] * (1 - alpha_multiplier)).astype(np.uint8)

    # Create new image from modified data
    result = Image.fromarray(data, 'RGBA')

    # Save as PNG
    result.save(output_path, 'PNG', optimize=True)
    print(f"Processed: {os.path.basename(input_path)}")

def main():
    carousel_dir = 'public/images/film-carousel'

    # Get all PNG files
    files = [f for f in os.listdir(carousel_dir) if f.lower().endswith('.png')]

    print(f"Re-processing {len(files)} PNG images with balanced edge removal\n")

    for filename in files:
        input_path = os.path.join(carousel_dir, filename)

        # Create temp filename
        temp_filename = f"temp_{filename}"
        temp_path = os.path.join(carousel_dir, temp_filename)

        try:
            process_film_image(input_path, temp_path)

            # Replace original with processed version
            os.replace(temp_path, input_path)
        except Exception as e:
            print(f"Error processing {filename}: {e}")
            if os.path.exists(temp_path):
                os.remove(temp_path)

    print(f"\nDone! Re-processed {len(files)} images with more conservative edge removal")

if __name__ == '__main__':
    main()
