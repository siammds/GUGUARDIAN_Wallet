import os
import subprocess

SCREENSHOT_DIR = os.path.abspath('evidence/screenshots')
os.makedirs(SCREENSHOT_DIR, exist_ok=True)
EDGE_PATH = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

mobile_tabs = {
    'dashboard': 'app_mobile_dashboard.png',
    'assistant': 'app_mobile_assistant.png',
    'permissions': 'app_mobile_permissions.png',
    'activity': 'app_mobile_activity.png'
}

for tab, filename in mobile_tabs.items():
    out_path = os.path.join(SCREENSHOT_DIR, filename)
    url = f"http://localhost:5173/?tab={tab}"
    cmd = [
        EDGE_PATH,
        '--headless',
        '--disable-gpu',
        '--hide-scrollbars',
        '--window-size=390,844',
        f'--screenshot={out_path}',
        url
    ]
    print(f"Capturing mobile view for {tab} -> {out_path}...")
    try:
        subprocess.run(cmd, timeout=15)
        if os.path.exists(out_path):
            print(f"  Success: {filename} ({os.path.getsize(out_path)} bytes)")
    except Exception as e:
        print(f"  Error capturing {tab}: {e}")
print("Mobile capture completed.")
