#!/usr/bin/env python3
"""Convert documents to Markdown using markitdown.

Usage:
    python3 convert-to-md.py <input_file>              # prints to stdout
    python3 convert-to-md.py <input_file> -o out.md    # writes to file
    python3 convert-to-md.py <dir>  -o <outdir>        # batch convert folder

Supported formats:
    PDF, DOCX, XLSX, PPTX, HTML, CSV, JSON, XML,
    MP3, MP4, WAV, JPG, PNG, TIFF, ZIP, and more.
"""

import sys
import os
from pathlib import Path
from markitdown import MarkItDown


def convert_file(src: Path, output: Path | None = None) -> str:
    md = MarkItDown()
    result = md.convert(str(src))
    md_text = result.text_content

    if output:
        output.parent.mkdir(parents=True, exist_ok=True)
        output.write_text(md_text, encoding="utf-8")
        return f"✓ {src.name} → {output}"

    print(md_text)
    return f"✓ {src.name}"


def convert_dir(src_dir: Path, out_dir: Path):
    exts = {
        ".pdf", ".docx", ".xlsx", ".pptx", ".html", ".htm",
        ".csv", ".json", ".xml", ".mp3", ".mp4", ".wav",
        ".jpg", ".jpeg", ".png", ".tiff", ".zip", ".txt",
    }
    files = [f for f in src_dir.iterdir() if f.suffix.lower() in exts]
    if not files:
        print(f"No supported files found in {src_dir}")
        return

    for f in sorted(files):
        out = out_dir / f.with_suffix(".md").name
        print(convert_file(f, out))

    print(f"\nConverted {len(files)} file(s) → {out_dir}")


def main():
    args = sys.argv[1:]
    if not args or args[0] in ("-h", "--help"):
        print(__doc__.strip())
        sys.exit(0)

    src = Path(args[0])
    if not src.exists():
        print(f"Error: {src} not found")
        sys.exit(1)

    out_path = None
    if "-o" in args:
        idx = args.index("-o")
        if idx + 1 < len(args):
            out_path = Path(args[idx + 1])

    if src.is_dir():
        if not out_path:
            out_path = src / "markdown"
        convert_dir(src, out_path)
    else:
        if out_path and out_path.suffix == "" and not out_path.exists():
            out_path = out_path / src.with_suffix(".md").name
        convert_file(src, out_path)


if __name__ == "__main__":
    main()
