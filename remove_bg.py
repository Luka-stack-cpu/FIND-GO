import sys
from PIL import Image

def remove_black_background(input_path, output_path):
    img = Image.open(input_path).convert("RGBA")
    data = img.getdata()
    
    new_data = []
    for r, g, b, a in data:
        # Extract alpha as the max of RGB (luminance approximation for black background)
        # This unpremultiplies the color to restore the original vibrant color
        # and creates a smooth alpha gradient.
        alpha = max(r, g, b)
        if alpha == 0:
            new_data.append((0, 0, 0, 0))
        else:
            new_r = min(255, int(r * 255 / alpha))
            new_g = min(255, int(g * 255 / alpha))
            new_b = min(255, int(b * 255 / alpha))
            # Boost alpha slightly to preserve solidity of the icon
            boosted_alpha = min(255, int(alpha * 1.2))
            new_data.append((new_r, new_g, new_b, boosted_alpha))
            
    img.putdata(new_data)
    img.save(output_path, "PNG")
    print("Background removed successfully.")

if __name__ == "__main__":
    remove_black_background(sys.argv[1], sys.argv[2])
