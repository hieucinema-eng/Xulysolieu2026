# Hướng dẫn điền dữ liệu vi phạm

File `violations_structure.json` đã được tạo nhưng đang trống. Bạn cần điền dữ liệu vi phạm vào file này.

## Cấu trúc file JSON:

```json
{
  "thuy_doan_violations": [
    {
      "index": 1,
      "letter": "A",
      "name": "Cấp Thủy Đoàn: Tên vi phạm 1",
      "penalty": "5000K"
    },
    {
      "index": 2,
      "letter": "B",
      "name": "Cấp Thủy Đoàn: Tên vi phạm 2",
      "penalty": "10000K"
    }
  ],
  "thuy_doi_violations": [
    {
      "index": 1,
      "letter": "A",
      "name": "Cấp Thủy Đội: Tên vi phạm 1",
      "penalty": "3000K"
    }
  ]
}
```

## Các trường dữ liệu:

- **index**: Số thứ tự (bắt đầu từ 0 hoặc 1)
- **letter**: Ký tự đại diện (A, B, C, ...)
- **name**: Tên vi phạm (phải có tiền tố "Cấp Thủy Đoàn: " hoặc "Cấp Thủy Đội: ")
- **penalty**: Mức phạt (dạng "5000K" nghĩa là 5,000,000 VND)

## Nguồn dữ liệu:

Nếu bạn có file Excel "Theo dõi Số liệu xử phạt 2026 (Câu trả lời).xlsx", có thể file đó chứa danh sách vi phạm. Hãy mở file đó và copy dữ liệu vào file JSON.

## Sau khi điền xong:

1. Lưu file `violations_structure.json`
2. Chạy lại ứng dụng: `CHAY_SERVER.bat`
3. Vào tab "Nhập số liệu" và kiểm tra dropdown "Chọn loại vi phạm"
