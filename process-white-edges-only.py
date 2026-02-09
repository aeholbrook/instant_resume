#!/usr/bin/env python3
"""
White edge remover:
- Only makes pure white pixels transparent if they're contiguous with an edge
- Preserves white pixels in the middle of the image
- Non-destructive (backs up originals)
"""

import os
from PIL import Image
import numpy as np
from scipy import ndimage

def process_image(input_path, output_path):
    """
    Make only edge-connected white pixels transparent.
    """
    # Open image and convert to RGBA
    img = Image.open(input_path).convert('RGBA')
    data = np.array(img)

    # Get RGB channels
    r, g, b, a = data[:,:,0], data[:,:,1], data[:,:,2], data[:,:,3]

    # Identify very white pixels (all RGB values >= 250)
    is_white = (r >= 250) & (g >= 250) & (b >= 250)

    # Create a mask for edge-connected white pixels
    # Start with all edge pixels
    height, width = data.shape[:2]
    edge_connected = np.zeros_like(is_white, dtype=bool)

    # Mark white pixels on all 4 edges
    edge_connected[0, :] = is_white[0, :]  # Top edge
    edge_connected[-1, :] = is_white[-1, :]  # Bottom edge
    edge_connected[:, 0] = is_white[:, 0]  # Left edge
    edge_connected[:, -1] = is_white[:, -1]  # Right edge

    # Flood fill to find all white pixels connected to edges
    # Use a structuring element for 8-connectivity (includes diagonals)
    structure = np.ones((3, 3), dtype=bool)

    # Iteratively expand from edge white pixels to connected white pixels
    while True:
        # Dilate edge_connected by 1 pixel
        expanded = ndimage.binary_dilation(edge_connected, structure=structure)
        # Only keep pixels that are also white
        new_edge_connected = expanded & is_white

        # If no new pixels were added, we're done
        if np.array_equal(new_edge_connected, edge_connected):
            break

        edge_connected = new_edge_connected

    # Make edge-connected white pixels transparent
    data[edge_connected, 3] = 0

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

    print(f"Processing {len(files)} images (edge-connected white pixels only)")
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
