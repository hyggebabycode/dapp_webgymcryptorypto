# Hướng dẫn thêm chức năng Lộ trình học cho PT

## Đã thêm gì?

### 1. Trang Coach Dashboard - Quản lý Khóa học

- ✅ Đổi tên menu "Giáo án" → "Khóa học của tôi"
- ✅ Hiển thị danh sách tất cả khóa học PT đang dạy
- ✅ Mỗi khóa học hiển thị: ảnh, tên, giá, số học viên, cấp độ, trạng thái

### 2. Modal Chi tiết Khóa học

Khi click "Xem chi tiết & Lộ trình" sẽ mở modal với 2 tabs:

#### Tab 1: Thông tin khóa học

- ✅ Sửa tên khóa học
- ✅ Sửa giá
- ✅ Sửa mô tả
- ✅ Sửa thời lượng (tuần)
- ✅ Sửa số lượng học viên tối đa
- ✅ Sửa cấp độ (mới bắt đầu/trung cấp/nâng cao/tất cả)

#### Tab 2: Lộ trình học

- ✅ Danh sách các buổi học (roadmap)
- ✅ Thêm buổi học mới (buổi số, tiêu đề, nội dung, mục tiêu)
- ✅ Sửa buổi học
- ✅ Xóa buổi học
- ✅ Hiển thị theo thứ tự (Buổi 1, 2, 3, 4, 5...)

## Cách Setup Database

### Bước 1: Tạo bảng course_lessons

Vào Supabase Dashboard → SQL Editor, chạy nội dung file:

```
add_course_lessons_table.sql
```

Bảng này lưu:

- `course_id`: ID khóa học
- `lesson_order`: Số thứ tự buổi học (1, 2, 3, 4, 5...)
- `title`: Tiêu đề buổi học
- `content`: Nội dung chi tiết
- `objectives`: Mục tiêu buổi học

### Bước 2: Thêm dữ liệu mẫu (tùy chọn)

Nếu muốn thêm 5 buổi học mẫu cho một khóa học:

1. Lấy ID khóa học từ bảng `courses` (copy UUID)
2. Chạy SQL sau (thay YOUR_COURSE_ID bằng ID thực):

```sql
INSERT INTO course_lessons (course_id, lesson_order, title, content, objectives) VALUES
  ('YOUR_COURSE_ID', 1, 'Buổi 1: Giới thiệu khóa học', 'Làm quen với môi trường, thiết bị và các quy tắc an toàn. Học cách khởi động đúng cách.', 'Hiểu rõ cấu trúc khóa học và chuẩn bị tinh thần'),
  ('YOUR_COURSE_ID', 2, 'Buổi 2: Kỹ thuật cơ bản', 'Học các động tác nền tảng, tư thế đúng và hơi thở. Thực hành động tác chậm.', 'Thực hiện đúng tư thế cơ bản, tránh chấn thương'),
  ('YOUR_COURSE_ID', 3, 'Buổi 3: Rèn luyện sức mạnh', 'Tập các bài tập sức mạnh cốt lõi và độ bền. Tăng cường cơ bụng, lưng, vai.', 'Tăng cường sức mạnh cơ bản 30%'),
  ('YOUR_COURSE_ID', 4, 'Buổi 4: Cardio và Stamina', 'Tập luyện tim mạch và tăng sức bền. Chạy bộ, nhảy dây, HIIT.', 'Cải thiện thể lực tổng quát, tăng sức bền'),
  ('YOUR_COURSE_ID', 5, 'Buổi 5: Tổng kết và đánh giá', 'Ôn tập kiến thức, test thể lực, đánh giá kết quả và lập kế hoạch tiếp theo.', 'Hoàn thành khóa học, đạt 80% mục tiêu');
```

## Cách sử dụng

### Với tài khoản PT:

1. Đăng nhập tài khoản coach/PT
2. Click menu "Khóa học của tôi"
3. Xem danh sách các khóa học đang dạy
4. Click "Xem chi tiết & Lộ trình" trên khóa học muốn quản lý

### Sửa thông tin khóa học:

1. Ở tab "Thông tin", điền các trường cần sửa
2. Click "Lưu thay đổi"

### Quản lý lộ trình học:

1. Chuyển sang tab "Lộ trình học"
2. Click "Thêm buổi học" để tạo buổi học mới
3. Điền:
   - Buổi số: 1, 2, 3, 4, 5...
   - Tiêu đề: "Buổi 1: Giới thiệu..."
   - Nội dung: Mô tả chi tiết buổi học
   - Mục tiêu: Kết quả mong muốn
4. Click "Lưu buổi học"
5. Để sửa: Click icon bút chì
6. Để xóa: Click icon thùng rác

## Cấu trúc RLS (Row Level Security)

### Quyền xem (SELECT):

- ✅ Coach xem lộ trình của khóa học mình dạy
- ✅ Học viên đã đăng ký xem lộ trình khóa học của mình
- ✅ Admin xem tất cả

### Quyền thêm/sửa/xóa (INSERT/UPDATE/DELETE):

- ✅ Coach quản lý lộ trình của khóa học mình dạy
- ✅ Admin quản lý tất cả

## Lưu ý

- Mỗi khóa học nên có 4-6 buổi học (gợi ý 5 buổi)
- Đánh số thứ tự rõ ràng: 1, 2, 3, 4, 5
- Mô tả nội dung cụ thể để học viên biết sẽ học gì
- Đặt mục tiêu đo lường được (VD: "Tăng 30% sức mạnh")

## Tính năng tương lai có thể mở rộng

- [ ] Upload video/hình ảnh cho từng buổi học
- [ ] Bài tập về nhà cho từng buổi
- [ ] Tracking tiến độ học viên theo từng buổi
- [ ] Quiz/test sau mỗi buổi
- [ ] Ghi chú riêng của PT cho từng học viên
