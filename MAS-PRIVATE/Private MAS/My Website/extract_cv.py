#!/usr/bin/env python
"""
Extract text from MohammadAltafSsabri-CV.pdf and write it to extracted_cv.txt
Requires: pypdf (pip install pypdf)
"""
import sys
from pathlib import Path

pdf_path = Path(__file__).parent / "MohammadAltafSsabri-CV.pdf"
out_path = Path(__file__).parent / "extracted_cv.txt"

if not pdf_path.exists():
    print(f"PDF not found: {pdf_path}")
    sys.exit(2)

try:
    from pypdf import PdfReader
except Exception as e:
    print("pypdf not installed. Install with: pip install pypdf")
    raise

reader = PdfReader(str(pdf_path))
texts = []
for p in reader.pages:
    try:
        texts.append(p.extract_text() or "")
    except Exception:
        # fallback: continue
        texts.append("")

content = "\n\n".join(texts)
out_path.write_text(content, encoding="utf-8")
print(f"Wrote extracted text to {out_path}")
