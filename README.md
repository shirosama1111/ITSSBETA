# HUST · Parking companion

Ứng dụng web tĩnh giúp theo dõi số lượt gửi xe ước tính còn lại trên thẻ và đặt mức dự phòng. Giao diện tiếng Việt có bổ sung nhãn tiếng Nhật theo sơ đồ MVP.

## Chạy thử

Mở `index.html` trong trình duyệt, hoặc chạy một máy chủ tĩnh tại thư mục dự án, ví dụ:

```bash
python3 -m http.server 8000
```

Sau đó truy cập `http://localhost:8000`.

## Triển khai lên Vercel

Import repository này vào Vercel. Đây là ứng dụng HTML/CSS/JavaScript tĩnh nên không cần build command hay framework preset; để trống Build Command và đặt Output Directory là `.` (hoặc chọn Other). Có thể triển khai trực tiếp từ thư mục gốc repository.

## Cách tính

- Số lượt còn lại = phần nguyên của số dư / phí mỗi lượt.
- Thời gian ước tính dựa trên số lượt còn lại và số lượt sử dụng trung bình mỗi tuần.
- Cảnh báo khi số lượt ước tính còn lại nhỏ hơn hoặc bằng mức dự phòng + 1.
- Ngày dự kiến hết lượt có thể tham khảo thêm các ngày sử dụng đã chọn.

Dữ liệu được lưu cục bộ trong trình duyệt bằng `localStorage`. Ứng dụng độc lập, không kết nối hoặc đọc dữ liệu từ hệ thống thẻ HUST. Các con số và ngày dự kiến chỉ mang tính tham khảo.
