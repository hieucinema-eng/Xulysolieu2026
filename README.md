# 📋 Ứng dụng Quản lý Số liệu Xử phạt

## 🚀 Cách chạy ứng dụng

1. **Double-click file:** `CHAY_SERVER.bat`
2. **Mở trình duyệt:** http://localhost:8000/index.html
3. **Sử dụng ứng dụng bình thường**

## ⚠️ Quan trọng

**KHÔNG thể mở file HTML trực tiếp** vì sẽ bị lỗi CORS. Phải chạy qua HTTP Server.

## 📝 Cấu hình

### Thông tin hiện tại:
- **Sheet ID**: `1ptc_rMLpejpTsBgFxE6Glg4eF2oHdV75WqT_COh59zg`
- **Apps Script URL**: `https://script.google.com/macros/s/AKfycbw6PPn9Jv5tFJ5Hf0zZ32KABkXNA1wUQ7P6thX3AfsqOVZ0dZrl2Zr60LJYEwPoPYqRDA/exec`

### Deploy Code.gs:

1. Mở Google Apps Script: https://script.google.com
2. Mở project của bạn
3. Copy **TOÀN BỘ** nội dung file `Code.gs`
4. Paste vào editor và **Lưu** (Ctrl+S)
5. **Deploy lại:**
   - Vào **Deploy** → **Manage deployments**
   - Click **Edit** (✏️) hoặc tạo deployment mới
   - Execute as: **Me**
   - Who has access: **Anyone**
   - Click **Deploy**

## 📊 Cấu trúc dữ liệu

- **Cột A-O**: Thông tin cơ bản (mỗi field một cột)
- **Cột P**: Violations dưới dạng JSON string

Dữ liệu tự động đồng bộ 2 chiều:
- ✅ Nhập từ HTML → Lưu vào Google Sheet
- ✅ Tìm kiếm từ HTML → Đọc từ Google Sheet

## 🔧 Files trong project

- `index.html` - File chính
- `script.js` - Logic xử lý
- `styles.css` - Styling
- `form-handler.js` - Xử lý form
- `Code.gs` - Apps Script code (copy vào Google Apps Script)
- `CHAY_SERVER.bat` - Script chạy server
- `start_server.py` - Server code
- `parse_excel.py` - Script cập nhật dữ liệu vi phạm từ Excel (Chạy file này khi update file Excel)
- `violations_structure.json` - Dữ liệu vi phạm đã parse

## 🔄 Cập nhật dữ liệu từ Excel

Nếu bạn cập nhật file Excel nguồn (`Theo dõi Số liệu xử phạt 2026 (Câu trả lời).xlsx`), hãy chạy lệnh sau để cập nhật lại danh sách vi phạm trong ứng dụng:

```bash
python parse_excel.py
```
