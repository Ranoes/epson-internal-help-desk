import argparse
import sys

from markitdown import MarkItDown


def main() -> int:
    parser = argparse.ArgumentParser(description="Convert a PDF file to markdown using MarkItDown.")
    parser.add_argument("pdf_path", help="Path to the PDF file to convert")
    args = parser.parse_args()

    converter = MarkItDown()
    result = converter.convert(args.pdf_path)
    markdown = getattr(result, "text_content", None) or getattr(result, "markdown", "") or ""

    if not markdown.strip():
        raise RuntimeError("MarkItDown returned empty output.")

    sys.stdout.write(markdown.strip())
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        sys.stderr.write(f"{type(exc).__name__}: {exc}\n")
        raise SystemExit(1) from exc