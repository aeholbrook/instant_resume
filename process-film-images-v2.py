#!/usr/bin/env python3
"""
Improved film carousel image processor:
- More aggressive white edge removal
- Better edge detection
- Handles film borders and notches
"""

import os
from PIL import Image
import numpy as np

def process_film_image(input_path, output_path):
    """
    Process a film image to aggressively remove white edges.
    """
    # Open image and convert to RGBA
    img = Image.open(input_path).convert('RGBA')
    data = np.array(img)

    # Get image dimensions
    height, width = data.shape[:2]

    # Define larger edge region (outer 10% of image on each side)
    edge_width = int(width * 0.10)
    edge_height = int(height * 0.10)

    # Create a mask for edge regions
    edge_mask = np.zeros((height, width), dtype=bool)

    # Mark edge regions
    edge_mask[:edge_height, :] = True  # Top
    edge_mask[-edge_height:, :] = True  # Bottom
    edge_mask[:, :edge_width] = True  # Left
    edge_mask[:, -edge_width:] = True  # Right

    # Get RGB channels
    r, g, b, a = data[:,:,0], data[:,:,1], data[:,:,2], data[:,:,3]

    # More aggressive white detection (lower threshold)
    white_threshold = 230  # Lowered from 240
    is_white = (r > white_threshold) & (g > white_threshold) & (b > white_threshold)

    # Also detect light gray/near-white
    light_threshold = 200
    is_light = (r > light_threshold) & (g > light_threshold) & (b > light_threshold)

    # Make white pixels in edge regions fully transparent
    make_transparent = is_white & edge_mask
    data[make_transparent, 3] = 0

    # Add gradient fade for light pixels in edges
    make_faded = is_light & edge_mask & ~make_transparent
    if make_faded.any():
        # Calculate average brightness
        avg_rgb = (r[make_faded].astype(float) + g[make_faded].astype(float) + b[make_faded].astype(float)) / 3
        # More aggressive fade: scale from 200-230 range
        alpha_multiplier = np.clip((230 - avg_rgb) / 30, 0, 0.8)
        data[make_faded, 3] = (data[make_faded, 3] * alpha_multiplier).astype(np.uint8)

    # Create new image from modified data
    result = Image.fromarray(data, 'RGBA')

    # Save as PNG
    result.save(output_path, 'PNG', optimize=True)
    print(f"Processed: {os.path.basename(input_path)}")

def main():
    carousel_dir = 'public/images/film-carousel'

    # Get all PNG files
    files = [f for f in os.listdir(carousel_dir) if f.lower().endswith('.png')]

    print(f"Re-processing {len(files)} PNG images with improved edge removal\n")

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

    print(f"\nDone! Re-processed {len(files)} images with improved edge removal")

if __name__ == '__main__':
    main()
