#!/usr/bin/env python3
"""Local static server for vchaudio.github.io.

Sends Cache-Control: no-store on every response so edits to JSON / CSS / JS
show up immediately on refresh (GitHub Pages and `python -m http.server` both
aggressively cache, which makes local editing painful). Run via serve.bat or:

    python scripts/serve.py [port]
"""

import http.server
import socketserver
import sys
import os
import urllib.parse
import posixpath

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8000

EXTENSIONS = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
    ".pdf": "application/pdf",
    ".mp4": "video/mp4",
    ".webm": "video/webm",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
    ".txt": "text/plain; charset=utf-8",
    ".b64.txt": "text/plain; charset=utf-8",
}


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def end_headers(self):
        # Force browsers to always revalidate / never cache while editing.
        self.send_header("Cache-Control", "no-store, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def guess_type(self, path):
        ext = posixpath.splitext(path)[1].lower()
        # Handle compound extensions like ".b64.txt".
        for key in (ext, "." + ".".join(path.lower().split(".")[-2:])):
            if key in EXTENSIONS:
                return EXTENSIONS[key]
        if ext in EXTENSIONS:
            return EXTENSIONS[ext]
        return "application/octet-stream"

    def log_message(self, format, *args):
        # Quieter, single-line logging.
        sys.stderr.write("%s - %s\n" % (self.address_string(), format % args))


class Server(socketserver.TCPServer):
    allow_reuse_address = True


def main():
    handler = Handler
    try:
        httpd = Server(("127.0.0.1", PORT), handler)
    except OSError as e:
        print("Could not bind to 127.0.0.1:%d — %s" % (PORT, e))
        print("Try another port:  python scripts/serve.py 8080")
        sys.exit(1)
    with httpd:
        url = "http://127.0.0.1:%d/" % PORT
        print("Serving %s" % ROOT)
        print("  Site:    %s" % url)
        print("  Admin:   %sadmin/" % url)
        print("  (no-cache headers on — Ctrl+C to stop)")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nStopping.")


if __name__ == "__main__":
    main()
