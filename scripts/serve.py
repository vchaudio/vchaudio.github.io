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
import socket
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


def lan_address(port):
    """Best-effort primary LAN IPv4 address (so a phone on the same network
    can reach the server). Falls back to 127.0.0.1 if none is found."""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except OSError:
        return "127.0.0.1"


def main():
    handler = Handler
    host = "0.0.0.0"
    try:
        httpd = Server((host, PORT), handler)
    except OSError as e:
        print("Could not bind to %s:%d — %s" % (host, PORT, e))
        print("Try another port:  python scripts/serve.py 8080")
        sys.exit(1)
    with httpd:
        local_url = "http://127.0.0.1:%d/" % PORT
        lan_ip = lan_address(PORT)
        lan_url = "http://%s:%d/" % (lan_ip, PORT) if lan_ip != "127.0.0.1" else None
        print("Serving %s" % ROOT)
        print("  Local:   %s" % local_url)
        if lan_url:
            print("  LAN:     %s   (open this on your phone, same Wi-Fi)" % lan_url)
        print("  Admin:   %sadmin/" % local_url)
        print("  (no-cache headers on — Ctrl+C to stop)")
        if lan_url:
            print("")
            print("  NOTE: bound to 0.0.0.0 so other devices on your LAN can")
            print("  connect. If your phone can't reach it, allow Python through")
            print("  the Windows Firewall (Private networks) when prompted.")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nStopping.")


if __name__ == "__main__":
    main()
