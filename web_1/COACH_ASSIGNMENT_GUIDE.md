# Hướng dẫn gán Huấn luyện viên cho Khóa học

## Đã cập nhật gì?

### 1. Hiển thị Coach trong danh sách khóa học (Admin Dashboard)

- ✅ Tên coach hiển thị ở góc trên ảnh khóa học
- ✅ Cảnh báo màu cam nếu khóa học chưa có coach
- ✅ Admin có thể click "Sửa" để thay đổi coach

### 2. Form Thêm/Sửa Khóa học

- ✅ Trường "Huấn luyện viên \*" là bắt buộc
- ✅ Dropdown hiển thị danh sách tất cả coach
- ✅ Admin phải chọn coach khi tạo khóa học mới
- ✅ Admin có thể đổi coach khi sửa khóa học

## Cách sử dụng

### Với tài khoản Admin:

#### Tạo khóa học mới:

1. Đăng nhập tài khoản admin
2. Click menu "Khóa học"
3. Click nút "➕ Thêm khóa học"
4. Điền thông tin khóa học
5. **Chọn Huấn luyện viên** từ dropdown (bắt buộc)
6. Click "Lưu khóa học"

#### Sửa/Đổi coach cho khóa học hiện có:

1. Vào menu "Khóa học"
2. Tìm khóa học cần đổi coach
3. Click nút "Sửa"
4. Chọn coach mới từ dropdown "Huấn luyện viên"
5. Click "Lưu thay đổi"

#### Kiểm tra khóa học chưa có coach:

- Khóa học chưa có coach sẽ hiển thị **cảnh báo màu cam** "⚠️ Chưa có huấn luyện viên"
- Admin nên sửa ngay để gán coach

## Setup cho Database hiện có

### Nếu bạn có khóa học cũ chưa có coach:

1. **Kiểm tra khóa học nào chưa có coach:**

   ```sql
   SELECT id, course_name, coach_id
   FROM courses
   WHERE coach_id IS NULL;
   ```

2. **Chạy file SQL để gán coach:**
   - Mở file `assign_coaches_to_courses.sql`
   - Chọn một trong 3 cách:
     - **Cách 1**: Gán thủ công từng khóa cho từng coach cụ thể
     - **Cách 2**: Tự động phân bổ đều cho các coach
     - **Cách 3**: Gán tất cả cho 1 coach mặc định
   - Chạy SQL trong Supabase Dashboard

3. **Xác nhận kết quả:**
   ```sql
   SELECT c.course_name, u.full_name as coach_name
   FROM courses c
   LEFT JOIN users u ON c.coach_id = u.id;
   ```

## Danh sách Coach hiện có

Từ ảnh bạn gửi, có 3 coach:

1. **hungtran winer** - coachhung@gymheart.com
2. **tran van hung1** - admin4@gymheart.com
3. **mua dong bang gia** - coach@gymheart.com

Để lấy UUID của các coach (cần cho SQL):

```sql
SELECT id, full_name, email
FROM users
WHERE role = 'coach';
```

## Ví dụ gán coach thủ công

```sql
-- Lấy ID của các coach
SELECT id, full_name FROM users WHERE role = 'coach';

-- Gán coach cho từng khóa học
UPDATE courses
SET coach_id = 'UUID_CUA_HUNGTRAN_WINER'
WHERE course_name = 'Yoga Cơ Bản';

UPDATE courses
SET coach_id = 'UUID_CUA_MUA_DONG_BANG_GIA'
WHERE course_name = 'Gym Tăng Cơ';

UPDATE courses
SET coach_id = 'UUID_CUA_TRAN_VAN_HUNG1'
WHERE course_name = 'Cardio Giảm Cân';
```

## Lưu ý quan trọng

- ⚠️ **Mỗi khóa học NÊN có coach** để học viên biết ai dạy
- ✅ Coach được hiển thị ngay trên ảnh khóa học
- ✅ Học viên có thể thấy coach khi đăng ký khóa
- ✅ Coach dashboard chỉ hiển thị khóa học của coach đó
- 🔄 Admin có thể thay đổi coach bất cứ lúc nào

## Tính năng tương lai

- [ ] Cho phép nhiều coach cùng dạy 1 khóa (co-teaching)
- [ ] Lịch sử thay đổi coach
- [ ] Thống kê số khóa học của mỗi coach
- [ ] Tự động gợi ý coach phù hợp theo chuyên môn
