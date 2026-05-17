# Hướng dẫn Tính năng Đăng ký làm PT (Coach)

## 📋 Tổng quan

Hệ thống đã được cập nhật với tính năng cho phép người dùng đăng ký làm Huấn luyện viên (PT/Coach) với quy trình phê duyệt từ Admin.

## 🔧 Các thay đổi đã thực hiện

### 1. Database (add_coach_requests.sql)

- Thêm cột `requested_role` vào bảng `users`
- Cột này lưu vai trò mà người dùng yêu cầu (coach, null)
- Tạo index để tối ưu truy vấn yêu cầu coach

**Chạy SQL này trong Supabase SQL Editor:**

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS requested_role VARCHAR(20);
CREATE INDEX IF NOT EXISTS idx_users_requested_role ON users(requested_role) WHERE requested_role IS NOT NULL;
```

### 2. Giao diện Đăng ký (auth.html)

- Thêm radio button cho người dùng chọn:
  - **Thành viên**: Đăng ký thông thường
  - **Huấn luyện viên (PT)**: Gửi yêu cầu làm coach
- Hiển thị thông báo: "Nếu đăng ký làm PT, yêu cầu sẽ được gửi đến Admin để xét duyệt"

### 3. Xử lý Đăng ký (auth.js)

- Lấy giá trị từ radio button `signup-role`
- Nếu chọn "coach", lưu `role='user'` và `requested_role='coach'`
- Nếu chọn "user", lưu `role='user'` và `requested_role=null`
- Hiển thị thông báo phù hợp:
  - **User**: "Đăng ký thành công! Vui lòng đăng nhập."
  - **Coach**: "Đăng ký thành công! Yêu cầu làm PT đã được gửi tới Admin. Vui lòng đợi phê duyệt."

### 4. Admin Dashboard (admin-dashboard.html)

#### Thêm cột "Yêu cầu" trong bảng Người dùng

- Hiển thị badge "YÊU CẦU LÀM COACH" nếu user có `requested_role='coach'`

#### Nút Chấp nhận / Từ chối

- Hiển thị 2 nút cho users có yêu cầu làm coach:
  - **Chấp nhận**: Cập nhật `role='coach'` và xóa `requested_role`
  - **Từ chối**: Xóa `requested_role`, giữ nguyên `role='user'`

#### Badge thông báo

- Hiển thị số lượng yêu cầu coach đang chờ ở menu "Người dùng"
- Badge màu cam với số lượng
- Tự động ẩn khi không có yêu cầu

#### Các function mới:

1. **`approveCoachRequest(userId)`**
   - Chấp nhận yêu cầu, chuyển user thành coach
   - Refresh danh sách users và coaches
   - Cập nhật badge

2. **`rejectCoachRequest(userId)`**
   - Từ chối yêu cầu
   - Refresh danh sách users
   - Cập nhật badge

3. **`updateCoachRequestsBadge()`**
   - Đếm số lượng yêu cầu coach đang chờ
   - Hiển thị/ẩn badge tùy theo số lượng
   - Được gọi khi:
     - Dashboard load
     - Approve request
     - Reject request

## 🚀 Hướng dẫn sử dụng

### Đối với Người dùng:

1. Vào trang đăng ký
2. Điền thông tin: Họ tên, Email, SĐT, Mật khẩu
3. Chọn loại tài khoản:
   - **Thành viên**: Đăng ký ngay, có thể đăng nhập và đăng ký khóa học
   - **Huấn luyện viên (PT)**: Gửi yêu cầu, đợi Admin phê duyệt
4. Nhấn "Đăng ký"
5. Nếu chọn PT, đợi Admin chấp nhận trước khi đăng nhập

### Đối với Admin:

1. Đăng nhập Admin Dashboard
2. Kiểm tra badge số lượng yêu cầu ở menu "Người dùng"
3. Vào mục "Người dùng"
4. Tìm users có badge cam "YÊU CẦU LÀM COACH"
5. Nhấn **"Chấp nhận"** để:
   - User trở thành Coach
   - Hiển thị trong danh sách Huấn luyện viên
   - Có thể được gán làm coach cho các khóa học
6. Nhấn **"Từ chối"** để:
   - Xóa yêu cầu
   - User vẫn là thành viên bình thường

## 📊 Luồng dữ liệu

```
User đăng ký làm PT
  ↓
role = 'user'
requested_role = 'coach'
  ↓
Admin thấy yêu cầu (badge + bảng)
  ↓
Admin chấp nhận          Admin từ chối
  ↓                           ↓
role = 'coach'           requested_role = null
requested_role = null    role = 'user'
  ↓                           ↓
User thành Coach         User vẫn là Member
```

## 🔐 Bảo mật

- Chỉ Admin mới thấy và xử lý yêu cầu
- User không thể tự set role='coach'
- Cần confirm trước khi approve/reject

## 📝 Ghi chú

- User có thể đăng nhập ngay sau khi đăng ký (role='user')
- Chỉ khi Admin chấp nhận, role mới chuyển thành 'coach'
- Coach có thể được gán làm giảng viên cho các khóa học
- Badge cập nhật real-time khi approve/reject

## 🛠️ Troubleshooting

**Lỗi: Column requested_role không tồn tại**
→ Chạy file `add_coach_requests.sql` trong Supabase SQL Editor

**Badge không hiển thị**
→ Kiểm tra console log, verify function `updateCoachRequestsBadge()` được gọi

**Không thấy nút Chấp nhận/Từ chối**
→ Verify user có `requested_role='coach'` và `role!='coach'` trong database
