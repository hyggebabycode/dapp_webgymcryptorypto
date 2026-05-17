# 🏋️ GYMHEART FITNESS - HỆ THỐNG QUẢN LÝ PHÒNG GYM

![GymHeart Logo](https://ui-avatars.com/api/?name=GymHeart&background=f42559&color=fff&size=200)

## 📋 MỤC LỤC

1. [Giới thiệu](#giới-thiệu)
2. [Tính năng](#tính-năng)
3. [Cài đặt](#cài-đặt)
4. [Cấu hình Supabase](#cấu-hình-supabase)
5. [Tài khoản mẫu](#tài-khoản-mẫu)
6. [Cấu trúc dự án](#cấu-trúc-dự-án)
7. [Hướng dẫn sử dụng](#hướng-dẫn-sử-dụng)
8. [Công nghệ sử dụng](#công-nghệ-sử-dụng)

---

## 🎯 GIỚI THIỆU

**GymHeart Fitness** là hệ thống quản lý phòng gym hiện đại với giao diện đẹp mắt, dễ sử dụng. Hệ thống hỗ trợ 3 loại người dùng với các quyền khác nhau:

- 👨‍💼 **Admin**: Quản lý toàn bộ hệ thống
- 👨‍🏫 **Coach**: Quản lý học viên và giáo án
- 👤 **User**: Đăng ký khóa học và theo dõi tiến độ

---

## ✨ TÍNH NĂNG

### 🔐 Hệ thống Authentication

- ✅ Đăng ký tài khoản mới
- ✅ Đăng nhập với email/password
- ✅ Phân quyền theo vai trò (Admin/Coach/User)
- ✅ Tự động chuyển hướng đến dashboard tương ứng

### 👨‍💼 Dashboard Admin

- ✅ Xem tổng quan thống kê hệ thống
- ✅ Quản lý người dùng (xem, sửa, xóa)
- ✅ Quản lý khóa học (thêm, sửa, xóa)
- ✅ Quản lý huấn luyện viên
- ✅ Xem lịch sử đăng ký
- ✅ Xem lịch học tổng thể

### 👨‍🏫 Dashboard Coach

- ✅ Xem danh sách học viên của mình
- ✅ Quản lý giáo án (thêm, sửa, xóa)
- ✅ Xem lịch dạy
- ✅ Thêm/xóa học viên trong lớp
- ✅ Theo dõi tiến độ học viên

### 👤 Dashboard User

- ✅ Đăng ký khóa học
- ✅ Xem lịch tập
- ✅ Theo dõi tiến độ học tập
- ✅ Cập nhật hồ sơ cá nhân
- ✅ Xem thông tin khóa học đã đăng ký

---

## 🚀 CÀI ĐẶT

### Bước 1: Clone hoặc Download dự án

```bash
# Nếu bạn có Git
git clone <repository-url>

# Hoặc download ZIP và giải nén
```

### Bước 2: Cấu trúc thư mục

Đảm bảo cấu trúc thư mục như sau:

```
webgymvs3/
├── index.html              # Trang chủ
├── auth.html               # Trang đăng nhập/đăng ký
├── admin-dashboard.html    # Dashboard Admin
├── coach-dashboard.html    # Dashboard Coach
├── user-dashboard.html     # Dashboard User
├── database_setup.sql      # File SQL cho Supabase
├── README.md              # File này
└── js/
    ├── supabase-config.js # Cấu hình Supabase
    └── auth.js            # Xử lý authentication
```

### Bước 3: Chạy web server

Bạn cần chạy dự án trên web server (không thể mở trực tiếp file HTML):

**Cách 1: Sử dụng VS Code Live Server**

1. Cài extension "Live Server" trong VS Code
2. Click chuột phải vào `index.html`
3. Chọn "Open with Live Server"

**Cách 2: Sử dụng Python**

```bash
# Python 3
python -m http.server 8000

# Truy cập: http://localhost:8000
```

**Cách 3: Sử dụng Node.js**

```bash
# Cài http-server
npm install -g http-server

# Chạy server
http-server -p 8000

# Truy cập: http://localhost:8000
```

---

## 🗄️ CÁU HÌNH SUPABASE

### Bước 1: Tạo project Supabase

1. Truy cập [https://supabase.com](https://supabase.com)
2. Đăng ký/Đăng nhập
3. Click "New Project"
4. Điền thông tin:
   - **Project Name**: GymHeart (hoặc tên bạn muốn)
   - **Database Password**: Đặt password mạnh
   - **Region**: Chọn gần bạn nhất
5. Click "Create new project" và đợi ~2 phút

### Bước 2: Chạy SQL Script

1. Trong Supabase Dashboard, vào **SQL Editor**
2. Click "New query"
3. Mở file `database_setup.sql` trong dự án
4. Copy toàn bộ nội dung
5. Paste vào SQL Editor
6. Click **Run** hoặc nhấn `Ctrl + Enter`
7. Đợi script chạy xong (~30 giây)

### Bước 3: Kiểm tra database

1. Vào **Table Editor**
2. Kiểm tra các bảng đã được tạo:
   - ✅ users (3 records)
   - ✅ courses (5 records)
   - ✅ class_enrollments (3 records)
   - ✅ schedules (4 records)
   - ✅ lesson_plans (3 records)

### Bước 4: Lấy API Keys

1. Vào **Settings** > **API**
2. Copy 2 thông tin sau:
   - **Project URL** (ví dụ: `https://xxxxx.supabase.co`)
   - **anon public key** (một đoạn text dài)

### Bước 5: Cấu hình trong code

1. Mở file `js/supabase-config.js`
2. Thay thế:

```javascript
const SUPABASE_URL = "YOUR_SUPABASE_URL"; // Thay bằng Project URL
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY"; // Thay bằng anon key
```

Ví dụ:

```javascript
const SUPABASE_URL = "https://abcdefghijk.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";
```

3. **Save file** (Ctrl + S)

### Bước 6: Kiểm tra kết nối

1. Mở trang web (http://localhost:8000)
2. Click "Tìm hiểu thêm"
3. Đăng nhập bằng tài khoản mẫu
4. Nếu đăng nhập thành công → Cấu hình đúng! 🎉

---

## 👥 TÀI KHOẢN MẪU

Database đã có sẵn 3 tài khoản để test:

### 1. Admin (Quản trị viên)

```
Email: admin@gymheart.com
Password: 123456
Quyền: Quản lý toàn bộ hệ thống
```

### 2. Coach (Huấn luyện viên)

```
Email: coach@gymheart.com
Password: 123456
Quyền: Quản lý học viên, giáo án, lịch dạy
```

### 3. User (Học viên)

```
Email: user@gymheart.com
Password: 123456
Quyền: Đăng ký khóa học, xem lịch tập
```

> ⚠️ **Lưu ý**: Đây là tài khoản demo, trong production nên đổi password!

---

## 📁 CẤU TRÚC DỰ ÁN

```
webgymvs3/
│
├── 📄 index.html                    # Trang landing page
│   ├── Hero section với gradient đẹp
│   ├── Thống kê (500+ học viên, 20+ PT...)
│   ├── Tính năng nổi bật
│   ├── Khóa học phổ biến
│   └── Call-to-action
│
├── 📄 auth.html                     # Trang đăng nhập & đăng ký
│   ├── Form đăng nhập
│   ├── Form đăng ký
│   ├── Tab switching
│   ├── Validation
│   └── Social login (UI only)
│
├── 📄 admin-dashboard.html          # Dashboard Admin
│   ├── Sidebar navigation
│   ├── Stats overview (4 cards)
│   ├── Quản lý khóa học
│   ├── Quản lý người dùng (table)
│   ├── Quản lý coaches
│   ├── Đăng ký khóa học
│   └── Lịch học tổng thể
│
├── 📄 coach-dashboard.html          # Dashboard Coach
│   ├── Sidebar navigation
│   ├── Stats (học viên, lớp, giáo án)
│   ├── Lịch hôm nay
│   ├── Quản lý học viên (grid cards)
│   ├── Lịch dạy tuần (calendar view)
│   └── Giáo án (list view)
│
├── 📄 user-dashboard.html           # Dashboard User
│   ├── Top navigation
│   ├── Welcome banner
│   ├── Stats (khóa học, buổi tập, calories)
│   ├── Khóa học đang theo học
│   ├── Lịch tập sắp tới
│   ├── Khóa học của tôi (tabs)
│   ├── Lịch tập (calendar)
│   └── Hồ sơ cá nhân (editable)
│
├── 📄 database_setup.sql            # SQL Script cho Supabase
│   ├── CREATE TABLES
│   ├── CREATE INDEXES
│   ├── CREATE TRIGGERS
│   ├── CREATE VIEWS
│   ├── CREATE FUNCTIONS
│   ├── ROW LEVEL SECURITY
│   └── SAMPLE DATA (3 users, 5 courses...)
│
├── 📄 README.md                     # File này
│   └── Hướng dẫn đầy đủ
│
└── 📁 js/
    ├── 📄 supabase-config.js       # Cấu hình Supabase Client
    │   ├── SUPABASE_URL
    │   ├── SUPABASE_ANON_KEY
    │   └── Initialize client
    │
    └── 📄 auth.js                   # Xử lý authentication
        ├── Login handler
        ├── Signup handler
        ├── Check auth function
        ├── Require auth function
        ├── Logout function
        └── Alert helper
```

---

## 📖 HƯỚNG DẪN SỬ DỤNG

### 🔹 Đăng ký tài khoản mới

1. Vào trang chủ → Click "Tìm hiểu thêm"
2. Click tab "Đăng ký"
3. Điền thông tin:
   - Họ và tên
   - Email
   - Số điện thoại
   - Mật khẩu (ít nhất 6 ký tự)
4. Click "Đăng ký"
5. Sau khi đăng ký thành công, tự động chuyển sang tab "Đăng nhập"
6. Đăng nhập với email/password vừa tạo

### 🔹 Đăng nhập

1. Vào trang "Tìm hiểu thêm"
2. Tab "Đăng nhập"
3. Nhập email và password
4. Click "Đăng nhập"
5. Hệ thống tự động chuyển đến dashboard tương ứng:
   - Admin → Admin Dashboard
   - Coach → Coach Dashboard
   - User → User Dashboard

### 🔹 Admin - Quản lý khóa học

1. Đăng nhập với tài khoản admin
2. Sidebar → Click "Khóa học"
3. Click "Thêm khóa học"
4. Điền thông tin khóa học
5. Click "Lưu"

### 🔹 Coach - Quản lý học viên

1. Đăng nhập với tài khoản coach
2. Sidebar → Click "Học viên"
3. Xem danh sách học viên
4. Click "Chi tiết" để xem thông tin
5. Click "Xóa" để xóa học viên khỏi lớp

### 🔹 User - Đăng ký khóa học

1. Đăng nhập với tài khoản user
2. Navigation → Click "Khóa học của tôi"
3. Chọn khóa học muốn đăng ký
4. Click "Đăng ký"
5. Thanh toán (demo)
6. Xem lịch tập trong "Lịch tập"

---

## 🛠️ CÔNG NGHỆ SỬ DỤNG

### Frontend

- **HTML5**: Cấu trúc trang web
- **Tailwind CSS**: Styling framework (CDN)
- **JavaScript (Vanilla)**: Logic xử lý
- **Material Symbols**: Icon library
- **Google Fonts (Lexend)**: Typography

### Backend & Database

- **Supabase**:
  - PostgreSQL Database
  - Authentication
  - Row Level Security
  - Real-time subscriptions (có thể dùng)

### Libraries

- **@supabase/supabase-js** (v2): Client library cho Supabase

---

## 🎨 THIẾT KẾ & UX

### Color Palette

- **Primary**: `#f42559` (Pink/Red)
- **Background Light**: `#fcf8f9`
- **Background Dark**: `#221014`
- **Text Primary**: `#1c0d11`
- **Text Secondary**: `#9c495e`

### Design System

- **Font Family**: Lexend (sans-serif)
- **Border Radius**:
  - Default: 0.25rem
  - Large: 0.5rem
  - Extra Large: 0.75rem
  - Full: 9999px
- **Spacing**: Tailwind default (4px base)

### Responsive Breakpoints

- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

---

## 🔒 BẢO MẬT

### Implemented

✅ Row Level Security (RLS) trong Supabase
✅ Password hashing (SHA-256 demo - nên dùng bcrypt)
✅ Role-based access control
✅ Protected routes (requireAuth)
✅ Input validation

### Nên cải thiện (Production)

- [ ] Sử dụng bcrypt cho password hashing
- [ ] Rate limiting cho login/signup
- [ ] CSRF protection
- [ ] XSS protection
- [ ] SQL injection prevention (Supabase đã handle)
- [ ] 2FA authentication
- [ ] Email verification
- [ ] Password reset flow
- [ ] Session management với refresh tokens

---

## 🐛 TROUBLESHOOTING

### Lỗi: "Cannot connect to Supabase"

**Nguyên nhân**: Chưa cấu hình Supabase URL/Key
**Giải pháp**:

1. Kiểm tra file `js/supabase-config.js`
2. Đảm bảo đã thay `YOUR_SUPABASE_URL` và `YOUR_SUPABASE_ANON_KEY`
3. Refresh trang (Ctrl + F5)

### Lỗi: "Email hoặc mật khẩu không đúng"

**Nguyên nhân**:

- Database chưa có data
- Nhập sai email/password
  **Giải pháp**:

1. Kiểm tra Table Editor trong Supabase
2. Đảm bảo có 3 users
3. Dùng tài khoản mẫu: `admin@gymheart.com` / `123456`

### Lỗi: "RLS policy violation"

**Nguyên nhân**: Row Level Security chặn query
**Giải pháp**:

1. Vào SQL Editor
2. Chạy lại section "ROW LEVEL SECURITY" trong `database_setup.sql`

### Trang không load được

**Nguyên nhân**: Mở file HTML trực tiếp
**Giải pháp**:

1. Phải chạy qua web server
2. Dùng Live Server / Python / Node.js
3. **KHÔNG** mở file:// trực tiếp

---

## 📝 DATABASE SCHEMA

### Tables

#### users

```sql
- id (UUID, PK)
- email (VARCHAR, UNIQUE)
- password_hash (VARCHAR)
- full_name (VARCHAR)
- phone (VARCHAR)
- avatar_url (TEXT)
- date_of_birth (DATE)
- gender (VARCHAR)
- role (ENUM: admin, user, coach)
- is_active (BOOLEAN)
- bio (TEXT)
- specialization (TEXT) -- for coaches
- years_of_experience (INTEGER) -- for coaches
- certification (TEXT) -- for coaches
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### courses

```sql
- id (UUID, PK)
- course_name (VARCHAR)
- description (TEXT)
- price (DECIMAL)
- duration_weeks (INTEGER)
- level (ENUM: beginner, intermediate, advanced, all_levels)
- max_students (INTEGER)
- current_students (INTEGER)
- image_url (TEXT)
- coach_id (UUID, FK → users)
- is_active (BOOLEAN)
- start_date (DATE)
- end_date (DATE)
- schedule_description (TEXT)
- benefits (TEXT[])
- requirements (TEXT[])
- created_by (UUID, FK → users)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### class_enrollments

```sql
- id (UUID, PK)
- user_id (UUID, FK → users)
- course_id (UUID, FK → courses)
- enrollment_date (TIMESTAMP)
- status (ENUM: pending, active, completed, cancelled)
- payment_status (VARCHAR)
- payment_amount (DECIMAL)
- payment_date (TIMESTAMP)
- progress_percentage (INTEGER)
- notes (TEXT)
- completed_at (TIMESTAMP)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### schedules

```sql
- id (UUID, PK)
- course_id (UUID, FK → courses)
- coach_id (UUID, FK → users)
- title (VARCHAR)
- description (TEXT)
- day_of_week (INTEGER) -- 0=Sunday, 6=Saturday
- start_time (TIME)
- end_time (TIME)
- location (VARCHAR)
- room_number (VARCHAR)
- max_capacity (INTEGER)
- current_capacity (INTEGER)
- is_recurring (BOOLEAN)
- specific_date (DATE)
- is_cancelled (BOOLEAN)
- cancellation_reason (TEXT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### lesson_plans

```sql
- id (UUID, PK)
- course_id (UUID, FK → courses)
- coach_id (UUID, FK → users)
- week_number (INTEGER)
- lesson_title (VARCHAR)
- objectives (TEXT)
- warm_up (TEXT)
- main_exercises (TEXT)
- cool_down (TEXT)
- equipment_needed (TEXT[])
- duration_minutes (INTEGER)
- difficulty_level (INTEGER) -- 1-5
- notes (TEXT)
- video_url (TEXT)
- is_published (BOOLEAN)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

---

## 🚀 ROADMAP

### Phase 1: MVP (Completed) ✅

- [x] Landing page
- [x] Authentication system
- [x] Admin dashboard
- [x] Coach dashboard
- [x] User dashboard
- [x] Database schema
- [x] Sample data

### Phase 2: Enhanced Features (TODO)

- [ ] Course registration flow with payment
- [ ] Email notifications
- [ ] Real-time chat between coach & user
- [ ] Progress tracking with charts
- [ ] Workout history
- [ ] Export reports to PDF
- [ ] Mobile responsive improvements
- [ ] Dark mode toggle

### Phase 3: Advanced (TODO)

- [ ] Mobile app (React Native)
- [ ] QR code check-in
- [ ] Attendance tracking
- [ ] Body measurement tracking
- [ ] Diet plan management
- [ ] Exercise video library
- [ ] Social features (feed, likes, comments)
- [ ] Gamification (badges, achievements)

---

## 👨‍💻 DEVELOPER NOTES

### Conventions

- **Naming**: camelCase cho JS, kebab-case cho CSS classes
- **Comments**: Tiếng Việt OK, English better
- **Indentation**: 4 spaces
- **Line endings**: LF (Unix)

### Git Workflow

```bash
# Feature branch
git checkout -b feature/new-feature

# Commit
git add .
git commit -m "feat: add new feature"

# Push
git push origin feature/new-feature

# Merge to main after review
```

### Testing Checklist

- [ ] Login với 3 loại tài khoản
- [ ] Đăng ký tài khoản mới
- [ ] CRUD operations (Admin)
- [ ] View schedules (Coach)
- [ ] Enroll course (User)
- [ ] Update profile (User)
- [ ] Responsive trên mobile
- [ ] Logout và redirect

---

## 📞 SUPPORT

Nếu gặp vấn đề, liên hệ:

- 📧 Email: support@gymheart.com (demo)
- 💬 Discord: GymHeart Community (demo)
- 🐛 GitHub Issues: [Link] (demo)

---

## 📄 LICENSE

MIT License - Free to use for educational purposes.

---

## 🙏 CREDITS

- **Design inspiration**: Tailwind UI, Dribbble
- **Icons**: Material Symbols by Google
- **Fonts**: Lexend by Google Fonts
- **Backend**: Supabase
- **Images**: Unsplash (placeholder)

---

## 📌 IMPORTANT NOTES

### ⚠️ Lưu ý quan trọng:

1. **Password Demo**: Tài khoản mẫu dùng password `123456` - KHÔNG dùng trong production
2. **API Keys**: KHÔNG commit file config có API keys lên Git public
3. **Security**: Code này là MVP demo, cần bổ sung security cho production
4. **Performance**: Chưa optimize for scale, phù hợp cho < 1000 users
5. **Browser Support**: Test trên Chrome/Firefox/Edge, chưa test Safari/IE

### ✅ Production Checklist:

- [ ] Đổi password default
- [ ] Enable SSL/HTTPS
- [ ] Setup proper authentication flow
- [ ] Add error tracking (Sentry)
- [ ] Add analytics (Google Analytics)
- [ ] Setup CI/CD pipeline
- [ ] Add unit tests
- [ ] Add E2E tests
- [ ] Setup monitoring (Uptime Robot)
- [ ] Backup database định kỳ
- [ ] Setup staging environment
- [ ] Add rate limiting
- [ ] Configure CORS properly
- [ ] Minify JS/CSS
- [ ] Optimize images
- [ ] Setup CDN (Cloudflare)

---

<div align="center">

## 💪 Made with ❤️ for GymHeart

**Version**: 1.0.0  
**Last Updated**: February 2026

[⬆️ Back to Top](#-gymheart-fitness---hệ-thống-quản-lý-phòng-gym)

</div>
