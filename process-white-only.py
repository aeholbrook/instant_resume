#!/usr/bin/env python3
"""
White-pixel-only remover:
- Only makes pure white pixels (RGB 250-255) transparent
- Doesn't affect any other pixels
- No edge detection - just targets white globally
"""

import os
from PIL import Image
import numpy as np

def process_image(input_path, output_path):
    """
    Make only pure white pixels transparent.
    """
    # Open image and convert to RGBA
    img = Image.open(input_path).convert('RGBA')
    data = np.array(img)

    # Get RGB channels
    r, g, b, a = data[:,:,0], data[:,:,1], data[:,:,2], data[:,:,3]

    # Only target VERY white pixels (all RGB values >= 250)
    is_pure_white = (r >= 250) & (g >= 250) & (b >= 250)

    # Make these pixels fully transparent
    data[is_pure_white, 3] = 0

    # Create new image from modified data
    result = Image.fromarray(data, 'RGBA')

    # Save as PNG
    result.save(output_path, 'PNG', optimize=True)
    print(f"Processed: {os.path.basename(input_path)}")

def main():
    carousel_dir = 'public/images/film-carousel'
    backup_dir = 'public/images/film-carousel/originals'

    # Create backup directory if it doesn't exist
    os.makedirs(backup_dir, exist_ok=True)

    # Get all image files (not already processed PNGs)
    supported_formats = ('.jpg', '.jpeg', '.webp', '.tif', '.tiff')
    files = [f for f in os.listdir(carousel_dir) if f.lower().endswith(supported_formats)]

    if not files:
        print("No new images to process. Only PNG files found (already processed).")
        return

    print(f"Processing {len(files)} images (white pixels only)")
    print(f"Originals will be backed up to: {backup_dir}\n")

    for filename in files:
        input_path = os.path.join(carousel_dir, filename)

        # Create output filename (always .png)
        name_without_ext = os.path.splitext(filename)[0]
        output_filename = f"{name_without_ext}.png"
        output_path = os.path.join(carousel_dir, output_filename)

        try:
            # Process image
            process_image(input_path, output_path)

            # Move original to backup directory (non-destructive)
            backup_path = os.path.join(backup_dir, filename)
            os.rename(input_path, backup_path)
            print(f"  Backed up to: originals/{filename}")
        except Exception as e:
            print(f"Error processing {filename}: {e}")

    print(f"\nDone! Processed {len(files)} images")
    print(f"Originals saved in: {backup_dir}")

if __name__ == '__main__':
    main()
