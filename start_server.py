#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Simple HTTP Server để chạy ứng dụng web
Giải quyết vấn đề CORS khi chạy file HTML trực tiếp
"""

import http.server
import socketserver
import webbrowser
import os
import sys
import io

# Fix for Windows console encoding
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

PORT = 8080

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Thêm CORS headers để tránh lỗi
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

def main():
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    Handler = MyHTTPRequestHandler
    
    try:
        with socketserver.TCPServer(("", PORT), Handler) as httpd:
            url = f"http://localhost:{PORT}/index.html"
            print("=" * 60)
            print("HTTP Server đang chạy!")
            print(f"URL: {url}")
            print("=" * 60)
            print("\nNhấn Ctrl+C để dừng server\n")
            
            # Tự động mở trình duyệt
            webbrowser.open(url)
            
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n\nServer đã dừng.")
        sys.exit(0)
    except OSError as e:
        if e.errno == 10048:  # Address already in use
            print(f"Port {PORT} đã được sử dụng!")
            print("Vui lòng đóng ứng dụng đang dùng port này hoặc đổi PORT trong file.")
        else:
            print(f"Lỗi: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
