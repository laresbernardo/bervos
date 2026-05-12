import os
from PIL import Image
import math

def get_dist(c1, c2):
    return math.sqrt(sum((a - b) ** 2 for a, b in zip(c1, c2)))

def process_image(file_path):
    print(f"Processing {file_path}...")
    img = Image.open(file_path).convert("RGBA")
    width, height = img.size
    
    # Target blue is the dark background of the logo
    # Sample from center-ish to be safe
    target_blue = img.getpixel((width // 4, height // 4))
    if target_blue[0] > 100: # If it's too light, try another spot
        target_blue = (23, 32, 107, 255) # Fallback to known BERVOS blue
    print(f"Target background color: {target_blue}")
    
    # Find bounding box of anything that is NOT white and IS similar to target_blue
    # Or just anything that isn't white margin.
    
    def is_margin(pixel):
        # Margin is white or the light-blue artifact I introduced
        return pixel[0] > 180 and pixel[1] > 180 and pixel[2] > 180

    left, top, right, bottom = 0, 0, width, height
    
    # Scan from top
    for y in range(height):
        if any(not is_margin(img.getpixel((x, y))) for x in range(width)):
            top = y
            break
    # Scan from bottom
    for y in range(height - 1, -1, -1):
        if any(not is_margin(img.getpixel((x, y))) for x in range(width)):
            bottom = y + 1
            break
    # Scan from left
    for x in range(width):
        if any(not is_margin(img.getpixel((x, y))) for y in range(height)):
            left = x
            break
    # Scan from right
    for x in range(width - 1, -1, -1):
        if any(not is_margin(img.getpixel((x, y))) for y in range(height)):
            right = x + 1
            break
            
    print(f"Detected logo bounds: {left}, {top}, {right}, {bottom}")
    
    # Shave an extra 10 pixels to be absolutely sure
    shave = 10
    left += shave
    top += shave
    right -= shave
    bottom -= shave
    
    # Crop
    cropped = img.crop((left, top, right, bottom))
    
    # Create new image filled with the solid blue
    final_img = Image.new("RGBA", (width, height), target_blue)
    
    # Scale cropped to fill (or nearly fill) the image
    # If we want 1:1 and no margins, we scale it to exactly width x height
    scaled_logo = cropped.resize((width, height), Image.Resampling.LANCZOS)
    
    # To be doubly sure about the edges, we can paste it onto the solid background
    # but resize should cover it.
    
    scaled_logo.save(file_path)
    print(f"Saved {file_path}")

if __name__ == "__main__":
    base_path = "/Users/bernardo/Library/CloudStorage/GoogleDrive-laresbernardo@gmail.com/My Drive/Documentos/BERVOS/BERVOS.org/public"
    files = [
        "apple-touch-icon.png",
        "android-chrome-512x512.png",
        "android-chrome-192x192.png"
    ]
    
    for f in files:
        full_path = os.path.join(base_path, f)
        if os.path.exists(full_path):
            process_image(full_path)
