#!/usr/bin/env python3
"""
Process film carousel images:
- Convert all to PNG
- Make white edges transparent (preserving interior white)
- Handle TIF/TIFF files
"""

import os
from PIL import Image
import numpy as np

def process_film_image(input_path, output_path):
    """
    Process a film image to make white edges transparent.
    Uses edge detection to only affect the borders/edges.
    """
    # Open image and convert to RGBA
    img = Image.open(input_path).convert('RGBA')
    data = np.array(img)

    # Get image dimensions
    height, width = data.shape[:2]

    # Define edge region (outer 5% of image on each side)
    edge_width = int(width * 0.05)
    edge_height = int(height * 0.05)

    # Create a mask for edge regions
    edge_mask = np.zeros((height, width), dtype=bool)

    # Mark edge regions
    edge_mask[:edge_height, :] = True  # Top
    edge_mask[-edge_height:, :] = True  # Bottom
    edge_mask[:, :edge_width] = True  # Left
    edge_mask[:, -edge_width:] = True  # Right

    # Get RGB channels
    r, g, b, a = data[:,:,0], data[:,:,1], data[:,:,2], data[:,:,3]

    # Find near-white pixels (RGB values all > 240)
    white_threshold = 240
    is_white = (r > white_threshold) & (g > white_threshold) & (b > white_threshold)

    # Only make white pixels in edge regions transparent
    make_transparent = is_white & edge_mask

    # Set alpha channel to 0 for these pixels
    data[make_transparent, 3] = 0

    # Also add a gradient fade for near-white pixels in edges
    near_white = (r > 220) & (g > 220) & (b > 220) & edge_mask & ~make_transparent
    if near_white.any():
        # Reduce alpha proportionally for near-white edge pixels
        avg_rgb = (r[near_white].astype(float) + g[near_white].astype(float) + b[near_white].astype(float)) / 3
        alpha_multiplier = (240 - avg_rgb) / 20  # Scale from 220-240 range
        alpha_multiplier = np.clip(alpha_multiplier, 0, 1)
        data[near_white, 3] = (data[near_white, 3] * alpha_multiplier).astype(np.uint8)

    # Create new image from modified data
    result = Image.fromarray(data, 'RGBA')

    # Save as PNG
    result.save(output_path, 'PNG', optimize=True)
    print(f"Processed: {os.path.basename(input_path)} -> {os.path.basename(output_path)}")

def main():
    carousel_dir = 'public/images/film-carousel'

    # Get all image files
    supported_formats = ('.jpg', '.jpeg', '.webp', '.png', '.tif', '.tiff')
    files = [f for f in os.listdir(carousel_dir) if f.lower().endswith(supported_formats)]

    print(f"Found {len(files)} images to process\n")

    for filename in files:
        input_path = os.path.join(carousel_dir, filename)

        # Create output filename (always .png)
        name_without_ext = os.path.splitext(filename)[0]
        output_filename = f"{name_without_ext}.png"
        output_path = os.path.join(carousel_dir, output_filename)

        try:
            process_film_image(input_path, output_path)

            # Remove original if it's not already a PNG
            if not filename.lower().endswith('.png'):
                os.remove(input_path)
                print(f"  Removed original: {filename}")
        except Exception as e:
            print(f"Error processing {filename}: {e}")

    print(f"\nDone! Processed {len(files)} images")

if __name__ == '__main__':
    main()
