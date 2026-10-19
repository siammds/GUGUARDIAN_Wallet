from PIL import Image, ImageDraw, ImageFont
import os

SCREENSHOT_DIR = os.path.abspath('evidence/screenshots')
images = [
    ('app_mobile_dashboard.png', '1. Mobile Dashboard'),
    ('app_mobile_assistant.png', '2. Directive Console'),
    ('app_mobile_permissions.png', '3. Permission Centre'),
    ('app_mobile_activity.png', '4. Activity Ledger')
]

# Load images
loaded = []
for fname, label in images:
    fpath = os.path.join(SCREENSHOT_DIR, fname)
    if os.path.exists(fpath):
        im = Image.open(fpath)
        loaded.append((im, label))

if len(loaded) == 4:
    # Target dimensions: Each screen width = 450, height = 974
    # Total panel width = 4 * 450 + 5 * 30 = 1950 px
    # Total panel height = 974 + 100 = 1074 px
    target_w = 400
    target_h = int(target_w * (844 / 390)) # ~865
    
    pad = 30
    header_h = 50
    panel_w = 4 * target_w + 5 * pad
    panel_h = target_h + header_h + pad * 2
    
    panel = Image.new('RGB', (panel_w, panel_h), (255, 255, 255))
    draw = ImageDraw.Draw(panel)
    
    x = pad
    for im, label in loaded:
        resized = im.resize((target_w, target_h), Image.Resampling.LANCZOS)
        
        # Paste screen
        y = pad + header_h
        panel.paste(resized, (x, y))
        
        # Draw clean border around screen
        draw.rectangle([x, y, x + target_w, y + target_h], outline=(150, 150, 150), width=2)
        
        # Draw label box
        draw.text((x + target_w // 2, pad + 20), label, fill=(15, 23, 42), anchor="mm")
        
        x += target_w + pad
        
    out_path = os.path.join(SCREENSHOT_DIR, 'mobile_app_showcase_panel.png')
    panel.save(out_path, dpi=(300, 300))
    print(f"Created composite mobile showcase: {out_path} ({panel.size})")
else:
    print("Could not load all 4 mobile images.")
