import os
import subprocess
import sys

BASE_DIR = r"c:\Users\princ\IONIC_PROJECTS\farmer-app-standalone-master"
EDGE_EXE = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

def run():
    print("1. Running generate_guides.py...")
    subprocess.run([sys.executable, os.path.join(BASE_DIR, "generate_guides.py")], cwd=BASE_DIR, check=True)

    print("2. Running generate_en_guide.py...")
    subprocess.run([sys.executable, os.path.join(BASE_DIR, "generate_en_guide.py")], cwd=BASE_DIR, check=True)

    print("3. Running generate_hi_guide.py...")
    subprocess.run([sys.executable, os.path.join(BASE_DIR, "generate_hi_guide.py")], cwd=BASE_DIR, check=True)

    en_html = os.path.abspath(os.path.join(BASE_DIR, "Melato_User_Guide_English.html"))
    hi_html = os.path.abspath(os.path.join(BASE_DIR, "Melato_User_Guide_Hindi.html"))

    en_pdf = os.path.abspath(os.path.join(BASE_DIR, "Melato_App_User_Guide_English.pdf"))
    hi_pdf = os.path.abspath(os.path.join(BASE_DIR, "Melato_App_User_Guide_Hindi.pdf"))

    print(f"3. Rendering {en_pdf} via Edge...")
    cmd_en = [
        EDGE_EXE,
        "--headless=new",
        "--no-sandbox",
        "--disable-gpu",
        "--no-pdf-header-footer",
        f"--print-to-pdf={en_pdf}",
        f"file:///{en_html.replace(os.sep, '/')}"
    ]
    subprocess.run(cmd_en, check=True)
    print(f"Rendered: {os.path.exists(en_pdf)}, size: {os.path.getsize(en_pdf) if os.path.exists(en_pdf) else 0} bytes")

    print(f"4. Rendering {hi_pdf} via Edge...")
    cmd_hi = [
        EDGE_EXE,
        "--headless=new",
        "--no-sandbox",
        "--disable-gpu",
        "--no-pdf-header-footer",
        f"--print-to-pdf={hi_pdf}",
        f"file:///{hi_html.replace(os.sep, '/')}"
    ]
    subprocess.run(cmd_hi, check=True)
    print(f"Rendered: {os.path.exists(hi_pdf)}, size: {os.path.getsize(hi_pdf) if os.path.exists(hi_pdf) else 0} bytes")

if __name__ == "__main__":
    run()
