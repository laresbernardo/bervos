from PIL import Image
import os

def debug_image(file_path):
    img = Image.open(file_path).convert("RGBA")
    width, height = img.size
    print(f"Image size: {width}x{height}")
    
    # Sample a few points
    points = [
        (0, 0),
        (width // 2, height // 2),
        (width // 4, height // 4),
        (10, 10),
        (width - 10, height - 10)
    ]
    
    for p in points:
        print(f"Color at {p}: {img.getpixel(p)}")

if __name__ == "__main__":
    path = "/Users/bernardo/Library/CloudStorage/GoogleDrive-laresbernardo@gmail.com/My Drive/Documentos/BERVOS/BERVOS.org/public/apple-touch-icon.png"
    if os.path.exists(path):
        debug_image(path)
