-- =====================================================
-- CHẠY TOÀN BỘ SCRIPT NÀY TRONG SUPABASE SQL EDITOR
-- =====================================================
-- Copy toàn bộ file này, paste vào SQL Editor và click Run

-- BƯỚC 1: Tạo lại tables và sample data
DROP TABLE IF EXISTS class_enrollments CASCADE;
DROP TABLE IF EXISTS lesson_plans CASCADE;
DROP TABLE IF EXISTS schedules CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS enrollment_status CASCADE;
DROP TYPE IF EXISTS course_level CASCADE;

CREATE TYPE user_role AS ENUM ('admin', 'user', 'coach');
CREATE TYPE enrollment_status AS ENUM ('pending', 'active', 'completed', 'cancelled');
CREATE TYPE course_level AS ENUM ('beginner', 'intermediate', 'advanced', 'all_levels');

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    avatar_url TEXT,
    date_of_birth DATE,
    gender VARCHAR(10),
    address TEXT,
    role user_role NOT NULL DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    bio TEXT,
    specialization TEXT,
    years_of_experience INTEGER,
    certification TEXT,
    requested_role VARCHAR(20), -- Role xin cấp khi đăng ký (vd: 'coach'). Admin xét duyệt.
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    duration_weeks INTEGER NOT NULL,
    level course_level NOT NULL,
    max_students INTEGER NOT NULL,
    current_students INTEGER DEFAULT 0,
    coach_id UUID REFERENCES users(id),
    is_active BOOLEAN DEFAULT true,
    start_date DATE,
    end_date DATE,
    schedule_description TEXT,
    benefits TEXT[],
    requirements TEXT[],
    image_url TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    coach_id UUID REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    location VARCHAR(255),
    room_number VARCHAR(50),
    max_capacity INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE class_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    enrollment_date TIMESTAMP DEFAULT NOW(),
    status enrollment_status DEFAULT 'pending',
    payment_status VARCHAR(50) DEFAULT 'pending',
    payment_method VARCHAR(50),
    payment_amount DECIMAL(10, 2),
    payment_date TIMESTAMP,
    tx_hash TEXT,
    progress_percentage INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, course_id)
);

CREATE TABLE lesson_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    coach_id UUID REFERENCES users(id),
    lesson_number INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    exercises TEXT[],
    duration_minutes INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS course_lessons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
    lesson_order INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    objectives TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- BƯỚC 2: Insert sample users với password PLAINTEXT "123456"
INSERT INTO users (id, email, password_hash, full_name, phone, role, is_active, bio, avatar_url, gender, date_of_birth) VALUES 
('11111111-1111-1111-1111-111111111111', 'admin@gymheart.com', '123456', 'admin', '0901234567', 'admin', true, 'Quản trị viên hệ thống GymHeart Fitness', 'https://ui-avatars.com/api/?name=Admin&background=f42559&color=fff&size=200', 'Nam', '1985-05-15'),
('22222222-2222-2222-2222-222222222222', 'coach@gymheart.com', '123456', 'Trần Thị Nam', '0907654321', 'coach', true, 'Huấn luyện viên chuyên nghiệp', 'https://ui-avatars.com/api/?name=Coach&background=f42559&color=fff&size=200', 'Nữ', '1990-03-20'),
('33333333-3333-3333-3333-333333333333', 'user@gymheart.com', '123456', 'Phạm Thị Lan Anh', '0912345678', 'user', true, 'Học viên GymHeart', 'https://ui-avatars.com/api/?name=User&background=f42559&color=fff&size=200', 'Nữ', '1995-08-10');

-- BƯỚC 3: Insert 6 khóa học mẫu
INSERT INTO courses (id, course_name, description, price, duration_weeks, level, max_students, current_students, coach_id, is_active, start_date, end_date, image_url, created_by) VALUES 
('c0000001-0000-0000-0000-000000000001', 'Giảm Cân Thần Tốc 30 Ngày', 'Chương trình giảm cân khoa học và hiệu quả, kết hợp cardio và strength training', 2500000, 4, 'beginner', 15, 3, '22222222-2222-2222-2222-222222222222', true, '2026-02-10', '2026-03-10', 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800', '11111111-1111-1111-1111-111111111111'),
('c0000002-0000-0000-0000-000000000002', 'Tăng Cơ Bắp Chuyên Nghiệp', 'Lộ trình tập luyện tăng cơ chuyên nghiệp với compound và isolation exercises', 3500000, 8, 'intermediate', 12, 5, '22222222-2222-2222-2222-222222222222', true, '2026-02-15', '2026-04-15', 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800', '11111111-1111-1111-1111-111111111111'),
('c0000003-0000-0000-0000-000000000003', 'Yoga Và Flexibility', 'Khóa học Yoga kết hợp stretching giúp tăng cường sự linh hoạt và giảm stress', 1800000, 6, 'all_levels', 20, 8, '22222222-2222-2222-2222-222222222222', true, '2026-02-12', '2026-03-26', 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800', '11111111-1111-1111-1111-111111111111'),
('c0000004-0000-0000-0000-000000000004', 'HIIT Training - Đốt Mỡ Cực Mạnh', 'High Intensity Interval Training - đốt cháy mỡ thừa hiệu quả trong thời gian ngắn', 2800000, 6, 'intermediate', 15, 4, '22222222-2222-2222-2222-222222222222', true, '2026-02-17', '2026-03-31', 'https://images.unsplash.com/photo-1549576490-b0b4831ef60a?w=800', '11111111-1111-1111-1111-111111111111'),
('c0000005-0000-0000-0000-000000000005', 'Pilates Core Strength', 'Tăng cường sức mạnh vùng core, cải thiện tư thế và độ linh hoạt cơ thể', 2200000, 6, 'beginner', 18, 6, '22222222-2222-2222-2222-222222222222', true, '2026-02-20', '2026-04-03', 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800', '11111111-1111-1111-1111-111111111111'),
('c0000006-0000-0000-0000-000000000006', 'CrossFit Extreme', 'Chương trình CrossFit chuyên sâu cho người có nền tảng tốt', 4200000, 12, 'advanced', 10, 2, '22222222-2222-2222-2222-222222222222', true, '2026-02-25', '2026-05-25', 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800', '11111111-1111-1111-1111-111111111111');

-- BƯỚC 4: Disable RLS
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE courses DISABLE ROW LEVEL SECURITY;
ALTER TABLE class_enrollments DISABLE ROW LEVEL SECURITY;
ALTER TABLE schedules DISABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE course_lessons DISABLE ROW LEVEL SECURITY;

-- BƯỚC 5: Thêm lịch học cho các khóa
INSERT INTO schedules (course_id, coach_id, title, description, day_of_week, start_time, end_time, location, room_number, max_capacity) VALUES
-- Giảm Cân - T2, T4, T6
('c0000001-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'Cardio buổi sáng', 'Đốt cháy calo sáng sớm', 1, '06:00:00', '07:30:00', 'Khu C', 'Phòng Cardio', 15),
('c0000001-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'Cardio buổi sáng', 'Đốt cháy calo sáng sớm', 3, '06:00:00', '07:30:00', 'Khu C', 'Phòng Cardio', 15),
('c0000001-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'Cardio buổi sáng', 'Đốt cháy calo sáng sớm', 5, '06:00:00', '07:30:00', 'Khu C', 'Phòng Cardio', 15),
-- Tăng Cơ - T3, T5, T7
('c0000002-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'Tập tăng cơ', 'Luyện với tạ và máy', 2, '17:00:00', '19:00:00', 'Khu B', 'Phòng Gym', 12),
('c0000002-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'Tập tăng cơ', 'Luyện với tạ và máy', 4, '17:00:00', '19:00:00', 'Khu B', 'Phòng Gym', 12),
('c0000002-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'Tập tăng cơ', 'Luyện với tạ và máy', 6, '08:00:00', '10:00:00', 'Khu B', 'Phòng Gym', 12),
-- Yoga - T2, T4
('c0000003-0000-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222', 'Yoga buổi tối', 'Thư giãn cơ thể', 1, '18:00:00', '19:30:00', 'Khu A', 'Phòng Yoga', 20),
('c0000003-0000-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222', 'Yoga buổi tối', 'Thư giãn cơ thể', 3, '18:00:00', '19:30:00', 'Khu A', 'Phòng Yoga', 20),
-- HIIT Training - T2, T5
('c0000004-0000-0000-0000-000000000004', '22222222-2222-2222-2222-222222222222', 'HIIT buổi sáng', 'Đốt mỡ cực mạnh', 1, '06:00:00', '07:00:00', 'Khu C', 'Phòng Cardio', 15),
('c0000004-0000-0000-0000-000000000004', '22222222-2222-2222-2222-222222222222', 'HIIT buổi sáng', 'Đốt mỡ cực mạnh', 4, '06:00:00', '07:00:00', 'Khu C', 'Phòng Cardio', 15),
-- Pilates - T3, T6
('c0000005-0000-0000-0000-000000000005', '22222222-2222-2222-2222-222222222222', 'Pilates Core', 'Tăng cường vùng core', 2, '18:30:00', '19:30:00', 'Khu A', 'Phòng Yoga', 18),
('c0000005-0000-0000-0000-000000000005', '22222222-2222-2222-2222-222222222222', 'Pilates Core', 'Tăng cường vùng core', 5, '18:30:00', '19:30:00', 'Khu A', 'Phòng Yoga', 18),
-- CrossFit - T2, T4, T6
('c0000006-0000-0000-0000-000000000006', '22222222-2222-2222-2222-222222222222', 'CrossFit Extreme', 'Training chuyên sâu', 1, '17:00:00', '18:30:00', 'Khu B', 'Phòng CrossFit', 10),
('c0000006-0000-0000-0000-000000000006', '22222222-2222-2222-2222-222222222222', 'CrossFit Extreme', 'Training chuyên sâu', 3, '17:00:00', '18:30:00', 'Khu B', 'Phòng CrossFit', 10),
('c0000006-0000-0000-0000-000000000006', '22222222-2222-2222-2222-222222222222', 'CrossFit Extreme', 'Training chuyên sâu', 5, '17:00:00', '18:30:00', 'Khu B', 'Phòng CrossFit', 10);

-- HOÀN THÀNH!
SELECT 'Setup thành công! Đăng nhập với: admin@gymheart.com / 123456' as status;
SELECT COUNT(*) as total_courses FROM courses;
SELECT COUNT(*) as total_users FROM users;
SELECT COUNT(*) as total_schedules FROM schedules;
