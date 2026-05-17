-- =====================================================
-- GYMHEART FITNESS - SUPABASE DATABASE SCHEMA
-- =====================================================
-- Há»‡ thá»‘ng quáº£n lÃ½ phÃ²ng gym vá»›i 3 loáº¡i ngÆ°á»i dÃ¹ng:
-- 1. ADMIN: Quáº£n lÃ½ toÃ n bá»™ há»‡ thá»‘ng, khÃ³a há»c, ngÆ°á»i dÃ¹ng
-- 2. USER: ÄÄƒng kÃ½ khÃ³a há»c, xem lá»‹ch táº­p
-- 3. COACH: Quáº£n lÃ½ há»c viÃªn, giÃ¡o Ã¡n, lá»‹ch dáº¡y
-- =====================================================

-- Drop existing tables (náº¿u cÃ³)
DROP TABLE IF EXISTS class_enrollments CASCADE;
DROP TABLE IF EXISTS lesson_plans CASCADE;
DROP TABLE IF EXISTS schedules CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS enrollment_status CASCADE;
DROP TYPE IF EXISTS course_level CASCADE;

-- =====================================================
-- 1. ENUM TYPES
-- =====================================================

-- Loáº¡i ngÆ°á»i dÃ¹ng
CREATE TYPE user_role AS ENUM ('admin', 'user', 'coach');

-- Tráº¡ng thÃ¡i Ä‘Äƒng kÃ½ khÃ³a há»c
CREATE TYPE enrollment_status AS ENUM ('pending', 'active', 'completed', 'cancelled');

-- Cáº¥p Ä‘á»™ khÃ³a há»c
CREATE TYPE course_level AS ENUM ('beginner', 'intermediate', 'advanced', 'all_levels');

-- =====================================================
-- 2. USERS TABLE - Báº£ng ngÆ°á»i dÃ¹ng
-- =====================================================
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
    specialization TEXT, -- Cho coach: chuyÃªn mÃ´n
    years_of_experience INTEGER, -- Cho coach: sá»‘ nÄƒm kinh nghiá»‡m
    certification TEXT, -- Cho coach: chá»©ng chá»‰
    requested_role VARCHAR(20), -- Role xin cáº¥p khi Ä‘Äƒng kÃ½ (vd: 'coach'). Admin xÃ©t duyá»‡t.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT chk_users_password_hash_bcrypt
            CHECK (password_hash ~ '^\\$2[aby]\\$[0-9]{2}\\$.{53}$')
);

-- Index cho tÃ¬m kiáº¿m nhanh
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- =====================================================
-- 3. COURSES TABLE - Báº£ng khÃ³a há»c
-- =====================================================
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    duration_weeks INTEGER NOT NULL, -- Thá»i lÆ°á»£ng khÃ³a há»c (tuáº§n)
    level course_level NOT NULL DEFAULT 'all_levels',
    max_students INTEGER DEFAULT 20,
    current_students INTEGER DEFAULT 0,
    image_url TEXT,
    coach_id UUID REFERENCES users(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    start_date DATE,
    end_date DATE,
    schedule_description TEXT, -- MÃ´ táº£ lá»‹ch há»c
    benefits TEXT[], -- Lá»£i Ã­ch cá»§a khÃ³a há»c (array)
    requirements TEXT[], -- YÃªu cáº§u (array)
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index
CREATE INDEX IF NOT EXISTS idx_courses_coach_id ON courses(coach_id);
CREATE INDEX IF NOT EXISTS idx_courses_is_active ON courses(is_active);
CREATE INDEX IF NOT EXISTS idx_courses_level ON courses(level);

-- =====================================================
-- 4. CLASS_ENROLLMENTS TABLE - Báº£ng Ä‘Äƒng kÃ½ khÃ³a há»c
-- =====================================================
CREATE TABLE class_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    enrollment_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status enrollment_status NOT NULL DEFAULT 'pending',
    payment_status VARCHAR(50) DEFAULT 'pending', -- pending, paid, refunded
    payment_method VARCHAR(50) DEFAULT 'cash', -- cash, transfer, card, ...
    payment_amount DECIMAL(10, 2),
    payment_date TIMESTAMP WITH TIME ZONE,
    tx_hash TEXT,
    progress_percentage INTEGER DEFAULT 0, -- Tiáº¿n Ä‘á»™ hoÃ n thÃ nh (0-100%)
    notes TEXT,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, course_id)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_enrollments_user_id ON class_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON class_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON class_enrollments(status);
CREATE INDEX IF NOT EXISTS idx_enrollments_tx_hash ON class_enrollments(tx_hash);

-- =====================================================
-- 5. SCHEDULES TABLE - Báº£ng lá»‹ch táº­p/dáº¡y
-- =====================================================
CREATE TABLE schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    coach_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    day_of_week INTEGER NOT NULL, -- 0=Sunday, 1=Monday, ..., 6=Saturday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    location VARCHAR(255),
    room_number VARCHAR(50),
    max_capacity INTEGER DEFAULT 20,
    current_capacity INTEGER DEFAULT 0,
    is_recurring BOOLEAN DEFAULT true, -- Láº·p láº¡i hÃ ng tuáº§n
    specific_date DATE, -- Cho buá»•i há»c Ä‘áº·c biá»‡t khÃ´ng láº·p láº¡i
    is_cancelled BOOLEAN DEFAULT false,
    cancellation_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index
CREATE INDEX IF NOT EXISTS idx_schedules_course_id ON schedules(course_id);
CREATE INDEX IF NOT EXISTS idx_schedules_coach_id ON schedules(coach_id);
CREATE INDEX IF NOT EXISTS idx_schedules_day_of_week ON schedules(day_of_week);

-- =====================================================
-- 6. LESSON_PLANS TABLE - Báº£ng giÃ¡o Ã¡n
-- =====================================================
CREATE TABLE lesson_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    coach_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    week_number INTEGER NOT NULL,
    lesson_title VARCHAR(255) NOT NULL,
    objectives TEXT, -- Má»¥c tiÃªu bÃ i há»c
    warm_up TEXT, -- Khá»Ÿi Ä‘á»™ng
    main_exercises TEXT, -- BÃ i táº­p chÃ­nh
    cool_down TEXT, -- ThÆ° giÃ£n
    equipment_needed TEXT[], -- Thiáº¿t bá»‹ cáº§n thiáº¿t
    duration_minutes INTEGER,
    difficulty_level INTEGER, -- 1-5
    notes TEXT,
    video_url TEXT,
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index
CREATE INDEX IF NOT EXISTS idx_lesson_plans_course_id ON lesson_plans(course_id);
CREATE INDEX IF NOT EXISTS idx_lesson_plans_coach_id ON lesson_plans(coach_id);

-- =====================================================
-- 7. COURSE_LESSONS TABLE - Lá»™ trÃ¬nh há»c tá»«ng khÃ³a
-- =====================================================
CREATE TABLE IF NOT EXISTS course_lessons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
    lesson_order INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    objectives TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index
CREATE INDEX IF NOT EXISTS idx_course_lessons_course_id ON course_lessons(course_id);
CREATE INDEX IF NOT EXISTS idx_course_lessons_order ON course_lessons(course_id, lesson_order);

-- Disable RLS (nháº¥t quÃ¡n vá»›i cÃ¡c báº£ng khÃ¡c)
ALTER TABLE course_lessons DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- 8. TRIGGER: Tá»± Ä‘á»™ng cáº­p nháº­t updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ãp dá»¥ng trigger cho táº¥t cáº£ cÃ¡c báº£ng
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_enrollments_updated_at BEFORE UPDATE ON class_enrollments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schedules_updated_at BEFORE UPDATE ON schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lesson_plans_updated_at BEFORE UPDATE ON lesson_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_course_lessons_updated_at BEFORE UPDATE ON course_lessons
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 8. TRIGGER: Tá»± Ä‘á»™ng cáº­p nháº­t sá»‘ lÆ°á»£ng há»c viÃªn
-- =====================================================
CREATE OR REPLACE FUNCTION update_course_student_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.status = 'active' THEN
        UPDATE courses 
        SET current_students = current_students + 1 
        WHERE id = NEW.course_id;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.status != 'active' AND NEW.status = 'active' THEN
            UPDATE courses 
            SET current_students = current_students + 1 
            WHERE id = NEW.course_id;
        ELSIF OLD.status = 'active' AND NEW.status != 'active' THEN
            UPDATE courses 
            SET current_students = current_students - 1 
            WHERE id = NEW.course_id;
        END IF;
    ELSIF TG_OP = 'DELETE' AND OLD.status = 'active' THEN
        UPDATE courses 
        SET current_students = current_students - 1 
        WHERE id = OLD.course_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_course_count_trigger
AFTER INSERT OR UPDATE OR DELETE ON class_enrollments
FOR EACH ROW EXECUTE FUNCTION update_course_student_count();

-- =====================================================
-- 9. ROW LEVEL SECURITY (RLS) - Báº£o máº­t cáº¥p hÃ ng
-- =====================================================
-- LÆ¯U Ã: Äang dÃ¹ng CUSTOM AUTHENTICATION nÃªn táº¡m DISABLE RLS
-- Náº¿u muá»‘n báº­t RLS, cáº§n chuyá»ƒn sang dÃ¹ng Supabase Auth

-- DISABLE RLS cho táº¥t cáº£ cÃ¡c báº£ng (cho phÃ©p truy cáº­p tá»± do)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE courses DISABLE ROW LEVEL SECURITY;
ALTER TABLE class_enrollments DISABLE ROW LEVEL SECURITY;
ALTER TABLE schedules DISABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_plans DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- 10. SAMPLE DATA - Dá»¯ liá»‡u máº«u
-- =====================================================

-- XÃ³a dá»¯ liá»‡u cÅ© (náº¿u cÃ³)
DELETE FROM lesson_plans;
DELETE FROM schedules;
DELETE FROM class_enrollments;
DELETE FROM courses;
DELETE FROM users;

-- 10.1. Táº¡o 3 tÃ i khoáº£n máº«u
-- Password cho táº¥t cáº£ cÃ¡c tÃ i khoáº£n: "123456"
-- (Trong thá»±c táº¿, nÃªn hash báº±ng bcrypt hoáº·c tÆ°Æ¡ng tá»±)

-- ADMIN - Quáº£n trá»‹ viÃªn
INSERT INTO users (
    id, email, password_hash, full_name, phone, role, 
    is_active, bio, avatar_url, gender, date_of_birth
) VALUES (
    '11111111-1111-1111-1111-111111111111',
    'admin@gymheart.com',
    '$2a$10$rXqBzqE3LqJLVR0GyqBh5.vJKJLxPmXPxB5mWxYqJ6Zp5VcJ2ZxSq', -- 123456
    'admin',
    '0901234567',
    'admin',
    true,
    'Quáº£n trá»‹ viÃªn há»‡ thá»‘ng GymHeart Fitness. Chá»‹u trÃ¡ch nhiá»‡m quáº£n lÃ½ toÃ n bá»™ hoáº¡t Ä‘á»™ng cá»§a phÃ²ng gym.',
    'https://ui-avatars.com/api/?name=Admin&background=f42559&color=fff&size=200',
    'Nam',
    '1985-05-15'
);

-- COACH - Huáº¥n luyá»‡n viÃªn
INSERT INTO users (
    id, email, password_hash, full_name, phone, role,
    is_active, bio, specialization, years_of_experience, certification,
    avatar_url, gender, date_of_birth
) VALUES (
    '22222222-2222-2222-2222-222222222222',
    'coach@gymheart.com',
    '$2a$10$rXqBzqE3LqJLVR0GyqBh5.vJKJLxPmXPxB5mWxYqJ6Zp5VcJ2ZxSq', -- 123456
    'Tráº§n Thá»‹ Nam',
    '0907654321',
    'coach',
    true,
    'Huáº¥n luyá»‡n viÃªn chuyÃªn nghiá»‡p vá»›i hÆ¡n 8 nÄƒm kinh nghiá»‡m trong lÄ©nh vá»±c fitness vÃ  bodybuilding.',
    'Fitness & Bodybuilding, Giáº£m cÃ¢n',
    8,
    'ISSA Certified Personal Trainer, ACE Group Fitness Instructor',
    'https://ui-avatars.com/api/?name=Coach+Nam&background=f42559&color=fff&size=200',
    'Ná»¯',
    '1990-03-20'
);

-- USER - Há»c viÃªn
INSERT INTO users (
    id, email, password_hash, full_name, phone, role,
    is_active, bio, avatar_url, gender, date_of_birth
) VALUES (
    '33333333-3333-3333-3333-333333333333',
    'user@gymheart.com',
    '$2a$10$rXqBzqE3LqJLVR0GyqBh5.vJKJLxPmXPxB5mWxYqJ6Zp5VcJ2ZxSq', -- 123456
    'Pháº¡m Thá»‹ Lan Anh',
    '0912345678',
    'user',
    true,
    'Há»c viÃªn nhiá»‡t huyáº¿t cá»§a GymHeart, Ä‘ang theo Ä‘uá»•i má»¥c tiÃªu giáº£m cÃ¢n vÃ  tÄƒng cÆ°á»ng sá»©c khá»e.',
    'https://ui-avatars.com/api/?name=Lan+Anh&background=f42559&color=fff&size=200',
    'Ná»¯',
    '1995-08-10'
);

-- 10.2. Táº¡o khÃ³a há»c máº«u

INSERT INTO courses (
    id, course_name, description, price, duration_weeks, level,
    max_students, current_students, coach_id, is_active, 
    start_date, end_date, schedule_description,
    benefits, requirements, created_by, image_url
) VALUES 
-- KhÃ³a 1: Giáº£m cÃ¢n tháº§n tá»‘c
(
    'c0000001-0000-0000-0000-000000000001',
    'Giáº£m CÃ¢n Tháº§n Tá»‘c 30 NgÃ y',
    'ChÆ°Æ¡ng trÃ¬nh giáº£m cÃ¢n khoa há»c vÃ  hiá»‡u quáº£, káº¿t há»£p giá»¯a cardio vÃ  strength training. PhÃ¹ há»£p cho ngÆ°á»i muá»‘n giáº£m 5-8kg trong 1 thÃ¡ng.',
    2500000,
    4,
    'beginner',
    15,
    3,
    '22222222-2222-2222-2222-222222222222',
    true,
    '2026-02-10',
    '2026-03-10',
    'Thá»© 2, 4, 6 - 6:00 AM - 7:30 AM',
    ARRAY['Giáº£m 5-8kg trong 30 ngÃ y', 'Cáº£i thiá»‡n sá»©c khá»e tim máº¡ch', 'TÄƒng cÆ°á»ng thá»ƒ lá»±c', 'TÆ° váº¥n dinh dÆ°á»¡ng miá»…n phÃ­'],
    ARRAY['KhÃ´ng cÃ³ bá»‡nh lÃ½ náº·ng', 'Cam káº¿t táº­p luyá»‡n Ä‘áº§y Ä‘á»§', 'TuÃ¢n thá»§ cháº¿ Ä‘á»™ Äƒn'],
    '11111111-1111-1111-1111-111111111111',
    'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800'
),
-- KhÃ³a 2: TÄƒng cÆ¡ báº¯p
(
    'c0000002-0000-0000-0000-000000000002',
    'TÄƒng CÆ¡ Báº¯p ChuyÃªn Nghiá»‡p',
    'Lá»™ trÃ¬nh táº­p luyá»‡n tÄƒng cÆ¡ chuyÃªn nghiá»‡p vá»›i cÃ¡c bÃ i táº­p compound vÃ  isolation. PhÃ¹ há»£p cho ngÆ°á»i muá»‘n phÃ¡t triá»ƒn cÆ¡ báº¯p toÃ n diá»‡n.',
    3500000,
    8,
    'intermediate',
    12,
    5,
    '22222222-2222-2222-2222-222222222222',
    true,
    '2026-02-15',
    '2026-04-15',
    'Thá»© 3, 5, 7 - 5:30 PM - 7:00 PM',
    ARRAY['TÄƒng 3-5kg cÆ¡ náº¡c', 'Cáº£i thiá»‡n sá»©c máº¡nh tá»•ng thá»ƒ', 'ÄiÃªu kháº¯c cÆ¡ thá»ƒ', 'HÆ°á»›ng dáº«n dinh dÆ°á»¡ng tÄƒng cÆ¡'],
    ARRAY['CÃ³ kinh nghiá»‡m táº­p gym cÆ¡ báº£n', 'KhÃ´ng cÃ³ cháº¥n thÆ°Æ¡ng', 'TuÃ¢n thá»§ cháº¿ Ä‘á»™ Äƒn tÄƒng cÆ¡'],
    '11111111-1111-1111-1111-111111111111',
    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800'
),
-- KhÃ³a 3: Yoga & Flexibility
(
    'c0000003-0000-0000-0000-000000000003',
    'Yoga VÃ  Flexibility',
    'KhÃ³a há»c Yoga káº¿t há»£p stretching giÃºp tÄƒng cÆ°á»ng sá»± linh hoáº¡t, giáº£m stress vÃ  cáº£i thiá»‡n tÆ° tháº¿. PhÃ¹ há»£p cho má»i lá»©a tuá»•i.',
    1800000,
    6,
    'all_levels',
    20,
    8,
    '22222222-2222-2222-2222-222222222222',
    true,
    '2026-02-12',
    '2026-03-26',
    'Thá»© 2, 4, 6 - 7:00 PM - 8:00 PM',
    ARRAY['TÄƒng Ä‘á»™ linh hoáº¡t', 'Giáº£m cÄƒng tháº³ng', 'Cáº£i thiá»‡n tÆ° tháº¿', 'TÄƒng cÆ°á»ng thÄƒng báº±ng'],
    ARRAY['KhÃ´ng cáº§n kinh nghiá»‡m', 'Mang theo tháº£m táº­p yoga'],
    '11111111-1111-1111-1111-111111111111',
    'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800'
),
-- KhÃ³a 4: HIIT Training
(
    'c0000004-0000-0000-0000-000000000004',
    'HIIT Training - Äá»‘t Má»¡ Cá»±c Máº¡nh',
    'High Intensity Interval Training - PhÆ°Æ¡ng phÃ¡p táº­p luyá»‡n cÆ°á»ng Ä‘á»™ cao, Ä‘á»‘t chÃ¡y má»¡ thá»«a hiá»‡u quáº£ trong thá»i gian ngáº¯n.',
    2800000,
    6,
    'intermediate',
    15,
    4,
    '22222222-2222-2222-2222-222222222222',
    true,
    '2026-02-17',
    '2026-03-31',
    'Thá»© 3, 5 - 6:00 AM - 7:00 AM',
    ARRAY['Äá»‘t chÃ¡y má»¡ nhanh chÃ³ng', 'TÄƒng sá»©c bá»n', 'Tiáº¿t kiá»‡m thá»i gian', 'TÄƒng tá»‘c Ä‘á»™ trao Ä‘á»•i cháº¥t'],
    ARRAY['Sá»©c khá»e tá»‘t', 'CÃ³ thá»ƒ lá»±c cÆ¡ báº£n', 'KhÃ´ng cÃ³ váº¥n Ä‘á» vá» tim máº¡ch'],
    '11111111-1111-1111-1111-111111111111',
    'https://images.unsplash.com/photo-1549060279-7e168fcee0c2?w=800'
),
-- KhÃ³a 5: Boxing Fitness
(
    'c0000005-0000-0000-0000-000000000005',
    'Boxing Fitness - VÃµ Thuáº­t & Thá»ƒ HÃ¬nh',
    'Káº¿t há»£p boxing vÃ  fitness training, giÃºp Ä‘á»‘t chÃ¡y calories, tÄƒng pháº£n xáº¡ vÃ  sá»©c máº¡nh.',
    3000000,
    8,
    'beginner',
    12,
    2,
    '22222222-2222-2222-2222-222222222222',
    true,
    '2026-02-20',
    '2026-04-20',
    'Thá»© 2, 4, 6 - 5:00 PM - 6:30 PM',
    ARRAY['Há»c ká»¹ thuáº­t boxing cÆ¡ báº£n', 'TÄƒng cÆ°á»ng thá»ƒ lá»±c', 'Äá»‘t chÃ¡y 500-700 calories/buá»•i', 'Giáº£i tá»a stress hiá»‡u quáº£'],
    ARRAY['KhÃ´ng cáº§n kinh nghiá»‡m', 'Chuáº©n bá»‹ gÄƒng tay boxing', 'Sá»©c khá»e tá»‘t'],
    '11111111-1111-1111-1111-111111111111',
    'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=800'
);

-- 10.3. Táº¡o Ä‘Äƒng kÃ½ khÃ³a há»c cho user

INSERT INTO class_enrollments (
    id, user_id, course_id, status, payment_status,
    payment_amount, payment_date, progress_percentage
) VALUES
-- User Ä‘Äƒng kÃ½ khÃ³a Giáº£m CÃ¢n
(
    '10000001-0000-0000-0000-000000000001',
    '33333333-3333-3333-3333-333333333333',
    'c0000001-0000-0000-0000-000000000001',
    'active',
    'paid',
    2500000,
    '2026-02-01 10:30:00',
    35
),
-- User Ä‘Äƒng kÃ½ khÃ³a Yoga
(
    '10000002-0000-0000-0000-000000000002',
    '33333333-3333-3333-3333-333333333333',
    'c0000003-0000-0000-0000-000000000003',
    'active',
    'paid',
    1800000,
    '2026-02-02 14:20:00',
    50
),
-- User Ä‘Äƒng kÃ½ khÃ³a HIIT (Ä‘ang chá»)
(
    '10000003-0000-0000-0000-000000000003',
    '33333333-3333-3333-3333-333333333333',
    'c0000004-0000-0000-0000-000000000004',
    'pending',
    'pending',
    2800000,
    NULL,
    0
);

-- 10.4. Táº¡o lá»‹ch dáº¡y

INSERT INTO schedules (
    id, course_id, coach_id, title, description,
    day_of_week, start_time, end_time, location, room_number, max_capacity
) VALUES
-- Lá»‹ch cho khÃ³a Giáº£m CÃ¢n
(
    'a0000001-0000-0000-0000-000000000001',
    'c0000001-0000-0000-0000-000000000001',
    '22222222-2222-2222-2222-222222222222',
    'Giáº£m CÃ¢n - Thá»© 2',
    'Cardio & HIIT Training',
    1, -- Monday
    '06:00:00',
    '07:30:00',
    'PhÃ²ng Cardio',
    'C101',
    15
),
(
    'a0000002-0000-0000-0000-000000000002',
    'c0000001-0000-0000-0000-000000000001',
    '22222222-2222-2222-2222-222222222222',
    'Giáº£m CÃ¢n - Thá»© 4',
    'Strength Training',
    3, -- Wednesday
    '06:00:00',
    '07:30:00',
    'PhÃ²ng Cardio',
    'C101',
    15
),
-- Lá»‹ch cho khÃ³a TÄƒng CÆ¡
(
    'a0000003-0000-0000-0000-000000000003',
    'c0000002-0000-0000-0000-000000000002',
    '22222222-2222-2222-2222-222222222222',
    'TÄƒng CÆ¡ - Thá»© 3',
    'Upper Body Workout',
    2, -- Tuesday
    '17:30:00',
    '19:00:00',
    'PhÃ²ng Táº¡',
    'W201',
    12
),
-- Lá»‹ch cho khÃ³a Yoga
(
    'a0000004-0000-0000-0000-000000000004',
    'c0000003-0000-0000-0000-000000000003',
    '22222222-2222-2222-2222-222222222222',
    'Yoga - Thá»© 2',
    'Hatha Yoga & Stretching',
    1, -- Monday
    '19:00:00',
    '20:00:00',
    'PhÃ²ng Yoga',
    'Y301',
    20
);

-- 10.5. Táº¡o giÃ¡o Ã¡n máº«u

INSERT INTO lesson_plans (
    id, course_id, coach_id, week_number, lesson_title,
    objectives, warm_up, main_exercises, cool_down,
    equipment_needed, duration_minutes, difficulty_level, is_published
) VALUES
-- GiÃ¡o Ã¡n tuáº§n 1 - KhÃ³a Giáº£m CÃ¢n
(
    'b0000001-0000-0000-0000-000000000001',
    'c0000001-0000-0000-0000-000000000001',
    '22222222-2222-2222-2222-222222222222',
    1,
    'Tuáº§n 1: LÃ m Quen VÃ  ÄÃ¡nh GiÃ¡',
    'ÄÃ¡nh giÃ¡ thá»ƒ tráº¡ng ban Ä‘áº§u, lÃ m quen vá»›i cÃ¡c bÃ i táº­p cÆ¡ báº£n',
    '5 phÃºt cháº¡y bá»™ nháº¹ + 5 phÃºt stretching Ä‘á»™ng',
    'Circuit Training: Squats 3x15, Push-ups 3x10, Jumping Jacks 3x20, Plank 3x30s',
    '10 phÃºt stretching tÄ©nh + thá»Ÿ sÃ¢u',
    ARRAY['Tháº£m táº­p', 'NÆ°á»›c uá»‘ng', 'KhÄƒn'],
    75,
    2,
    true
),
-- GiÃ¡o Ã¡n tuáº§n 2 - KhÃ³a Giáº£m CÃ¢n
(
    'b0000002-0000-0000-0000-000000000002',
    'c0000001-0000-0000-0000-000000000001',
    '22222222-2222-2222-2222-222222222222',
    2,
    'Tuáº§n 2: TÄƒng CÆ°á»ng Cardio',
    'TÄƒng cÆ°á»ng kháº£ nÄƒng Ä‘á»‘t chÃ¡y má»¡ thÃ´ng qua cardio',
    '5 phÃºt cháº¡y bá»™ + dynamic stretching',
    'HIIT: Sprint 30s/Rest 30s x 10 rounds, Burpees 3x12, Mountain Climbers 3x20',
    '10 phÃºt cardio nháº¹ + stretching',
    ARRAY['GiÃ y cháº¡y bá»™', 'Tháº£m táº­p', 'NÆ°á»›c uá»‘ng'],
    80,
    3,
    true
),
-- GiÃ¡o Ã¡n tuáº§n 1 - KhÃ³a TÄƒng CÆ¡
(
    'b0000003-0000-0000-0000-000000000003',
    'c0000002-0000-0000-0000-000000000002',
    '22222222-2222-2222-2222-222222222222',
    1,
    'Tuáº§n 1: Foundation - Upper Body',
    'XÃ¢y dá»±ng ná»n táº£ng sá»©c máº¡nh pháº§n thÃ¢n trÃªn',
    '10 phÃºt cardio nháº¹ + shoulder mobility',
    'Bench Press 4x8, Barbell Row 4x8, Overhead Press 3x10, Chin-ups 3xMax',
    'Stretching thÃ¢n trÃªn + foam rolling',
    ARRAY['Barbell', 'Bench', 'Pull-up bar', 'Foam roller'],
    90,
    4,
    true
);

-- =====================================================
-- 11. VIEWS - Táº¡o views há»¯u Ã­ch
-- =====================================================

-- View: ThÃ´ng tin chi tiáº¿t khÃ³a há»c vá»›i coach
CREATE OR REPLACE VIEW v_course_details AS
SELECT 
    c.*,
    u.full_name as coach_name,
    u.email as coach_email,
    u.avatar_url as coach_avatar,
    u.specialization as coach_specialization,
    (c.max_students - c.current_students) as available_slots
FROM courses c
LEFT JOIN users u ON c.coach_id = u.id;

-- View: ThÃ´ng tin chi tiáº¿t Ä‘Äƒng kÃ½ khÃ³a há»c
CREATE OR REPLACE VIEW v_enrollment_details AS
SELECT 
    e.*,
    u.full_name as student_name,
    u.email as student_email,
    u.avatar_url as student_avatar,
    c.course_name,
    c.duration_weeks,
    c.level as course_level,
    coach.full_name as coach_name
FROM class_enrollments e
JOIN users u ON e.user_id = u.id
JOIN courses c ON e.course_id = c.id
LEFT JOIN users coach ON c.coach_id = coach.id;

-- View: Lá»‹ch dáº¡y chi tiáº¿t
CREATE OR REPLACE VIEW v_schedule_details AS
SELECT 
    s.*,
    c.course_name,
    c.level as course_level,
    u.full_name as coach_name,
    u.avatar_url as coach_avatar,
    CASE s.day_of_week
        WHEN 0 THEN 'Chá»§ Nháº­t'
        WHEN 1 THEN 'Thá»© Hai'
        WHEN 2 THEN 'Thá»© Ba'
        WHEN 3 THEN 'Thá»© TÆ°'
        WHEN 4 THEN 'Thá»© NÄƒm'
        WHEN 5 THEN 'Thá»© SÃ¡u'
        WHEN 6 THEN 'Thá»© Báº£y'
    END as day_name
FROM schedules s
JOIN courses c ON s.course_id = c.id
JOIN users u ON s.coach_id = u.id;

-- =====================================================
-- 12. FUNCTIONS - CÃ¡c hÃ m há»¯u Ã­ch
-- =====================================================

-- HÃ m: Láº¥y danh sÃ¡ch há»c viÃªn trong má»™t khÃ³a há»c
CREATE OR REPLACE FUNCTION get_course_students(course_uuid UUID)
RETURNS TABLE (
    student_id UUID,
    student_name VARCHAR,
    student_email VARCHAR,
    enrollment_date TIMESTAMP WITH TIME ZONE,
    progress_percentage INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.full_name,
        u.email,
        e.enrollment_date,
        e.progress_percentage
    FROM class_enrollments e
    JOIN users u ON e.user_id = u.id
    WHERE e.course_id = course_uuid 
      AND e.status = 'active'
    ORDER BY e.enrollment_date DESC;
END;
$$ LANGUAGE plpgsql;

-- HÃ m: Láº¥y lá»‹ch dáº¡y cá»§a coach trong tuáº§n
CREATE OR REPLACE FUNCTION get_coach_weekly_schedule(coach_uuid UUID)
RETURNS TABLE (
    schedule_id UUID,
    course_name VARCHAR,
    day_of_week INTEGER,
    day_name VARCHAR,
    start_time TIME,
    end_time TIME,
    location VARCHAR,
    current_capacity INTEGER,
    max_capacity INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        c.course_name::VARCHAR,
        s.day_of_week,
        CASE s.day_of_week
            WHEN 0 THEN 'Chá»§ Nháº­t'::VARCHAR
            WHEN 1 THEN 'Thá»© Hai'::VARCHAR
            WHEN 2 THEN 'Thá»© Ba'::VARCHAR
            WHEN 3 THEN 'Thá»© TÆ°'::VARCHAR
            WHEN 4 THEN 'Thá»© NÄƒm'::VARCHAR
            WHEN 5 THEN 'Thá»© SÃ¡u'::VARCHAR
            WHEN 6 THEN 'Thá»© Báº£y'::VARCHAR
        END,
        s.start_time,
        s.end_time,
        s.location::VARCHAR,
        s.current_capacity,
        s.max_capacity
    FROM schedules s
    JOIN courses c ON s.course_id = c.id
    WHERE s.coach_id = coach_uuid 
      AND s.is_cancelled = false
    ORDER BY s.day_of_week, s.start_time;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 13. FUNCTIONS: Admin quáº£n trá»‹
-- =====================================================

-- HÃ m: Admin reset password cá»§a user báº¥t ká»³
CREATE OR REPLACE FUNCTION admin_reset_user_password(
  target_user_id UUID,
  new_password TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  -- Kiá»ƒm tra user hiá»‡n táº¡i cÃ³ pháº£i admin khÃ´ng
  IF NOT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Chá»‰ admin má»›i cÃ³ quyá»n reset password';
  END IF;

  -- Cáº­p nháº­t password
  UPDATE public.users
  SET password_hash = new_password, updated_at = NOW()
  WHERE id = target_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'KhÃ´ng tÃ¬m tháº¥y user';
  END IF;

  RETURN json_build_object('success', true, 'message', 'Password updated');
END;
$$;

-- =====================================================
-- HOÃ€N THÃ€NH DATABASE SETUP
-- =====================================================

-- Hiá»ƒn thá»‹ thá»‘ng kÃª
SELECT 'Database setup completed successfully!' as status;
SELECT COUNT(*) as total_users FROM users;
SELECT COUNT(*) as total_courses FROM courses;
SELECT COUNT(*) as total_enrollments FROM class_enrollments;
SELECT COUNT(*) as total_schedules FROM schedules;
SELECT COUNT(*) as total_lesson_plans FROM lesson_plans;

-- 10.6. Táº¡o lá»™ trÃ¬nh há»c máº«u (course_lessons)
INSERT INTO course_lessons (course_id, lesson_order, title, content, objectives) VALUES
-- KhÃ³a 1: Giáº£m CÃ¢n Tháº§n Tá»‘c
('c0000001-0000-0000-0000-000000000001', 1, 'Buá»•i 1: Khá»Ÿi Ä‘á»™ng vÃ  ÄÃ¡nh giÃ¡ thá»ƒ tráº¡ng', 'LÃ m quen vá»›i chÆ°Æ¡ng trÃ¬nh, Ä‘o chá»‰ sá»‘ cÆ¡ thá»ƒ (BMI, vÃ²ng eo), há»c khá»Ÿi Ä‘á»™ng an toÃ n.', 'Hiá»ƒu cÆ¡ cháº¿ giáº£m cÃ¢n, náº¯m ká»¹ thuáº­t khá»Ÿi Ä‘á»™ng Ä‘Ãºng cÃ¡ch'),
('c0000001-0000-0000-0000-000000000001', 2, 'Buá»•i 2: Cardio cÆ¡ báº£n', 'Äi bá»™ nhanh, cháº¡y nháº¹, Ä‘áº¡p xe. Táº­p 30-40 phÃºt vá»›i cÆ°á»ng Ä‘á»™ vá»«a pháº£i.', 'XÃ¢y dá»±ng ná»n táº£ng cardio, Ä‘á»‘t 300-400 kcal'),
('c0000001-0000-0000-0000-000000000001', 3, 'Buá»•i 3: Circuit Training', 'Jumping jacks, burpees, mountain climbers. Má»—i Ä‘á»™ng tÃ¡c 30s, nghá»‰ 15s, 4-5 vÃ²ng.', 'Äá»‘t calo tá»‘i Ä‘a 500-600 kcal, tÄƒng trao Ä‘á»•i cháº¥t'),
('c0000001-0000-0000-0000-000000000001', 4, 'Buá»•i 4: Strength Training', 'Squat, lunge, push-up, plank vá»›i táº¡ nhá». 3 sets x 12-15 reps.', 'TÄƒng cÆ¡ náº¡c, nÃ¢ng cao Ä‘á»‘t calo khi nghá»‰'),
('c0000001-0000-0000-0000-000000000001', 5, 'Buá»•i 5: HIIT nÃ¢ng cao + Tá»•ng káº¿t', 'Sprint 30s + Ä‘i bá»™ 60s x 10 láº§n. Äo láº¡i chá»‰ sá»‘, lÃªn káº¿ hoáº¡ch tiáº¿p theo.', 'Äá»‘t má»¡ tá»‘i Ä‘a, Ä‘Ã¡nh giÃ¡ káº¿t quáº£ sau 30 ngÃ y'),
-- KhÃ³a 2: TÄƒng CÆ¡ Báº¯p
('c0000002-0000-0000-0000-000000000002', 1, 'Buá»•i 1: Ná»n táº£ng - Upper Body', 'Bench Press, Barbell Row, Overhead Press, Chin-ups. Táº­p vá»›i táº¡ vá»«a sá»©c.', 'XÃ¢y dá»±ng sá»©c máº¡nh thÃ¢n trÃªn'),
('c0000002-0000-0000-0000-000000000002', 2, 'Buá»•i 2: Ná»n táº£ng - Lower Body', 'Squat, Deadlift, Leg Press, Calf Raises. ÄÃºng tÆ° tháº¿ lÃ  Æ°u tiÃªn.', 'XÃ¢y dá»±ng sá»©c máº¡nh thÃ¢n dÆ°á»›i'),
('c0000002-0000-0000-0000-000000000002', 3, 'Buá»•i 3: ToÃ n thÃ¢n + Dinh dÆ°á»¡ng', 'Compound exercises toÃ n thÃ¢n, hÆ°á»›ng dáº«n cháº¿ Ä‘á»™ Äƒn tÄƒng cÆ¡ (protein, carb).', 'Phá»‘i há»£p táº­p vÃ  Äƒn Ä‘Ãºng cÃ¡ch Ä‘á»ƒ tÄƒng cÆ¡ hiá»‡u quáº£'),
-- KhÃ³a 3: Yoga & Flexibility
('c0000003-0000-0000-0000-000000000003', 1, 'Buá»•i 1: Yoga cÆ¡ báº£n & Thá»Ÿ', 'TÆ° tháº¿ Mountain, Downward Dog, Child Pose. HÆ°á»›ng dáº«n ká»¹ thuáº­t thá»Ÿ.', 'Náº¯m tÆ° tháº¿ ná»n táº£ng, xÃ¢y dá»±ng thÃ³i quen thá»Ÿ Ä‘Ãºng'),
('c0000003-0000-0000-0000-000000000003', 2, 'Buá»•i 2: TÄƒng linh hoáº¡t', 'Sun Salutation, Warrior series, hip opening poses. 60 phÃºt liÃªn tá»¥c.', 'TÄƒng Ä‘á»™ linh hoáº¡t toÃ n thÃ¢n, giáº£m cÄƒng cÆ¡');

SELECT COUNT(*) as total_course_lessons FROM course_lessons;

-- =====================================================
-- HÆ¯á»šNG DáºªN Sá»¬ Dá»¤NG
-- =====================================================
/*
TÃ€I KHOáº¢N MáºªU:
1. Admin: admin@gymheart.com / 123456
2. Coach: coach@gymheart.com / 123456
3. User: user@gymheart.com / 123456

CÃC BÆ¯á»šC CÃ€I Äáº¶T TRÃŠN SUPABASE:
1. ÄÄƒng nháº­p vÃ o Supabase Dashboard
2. Táº¡o project má»›i hoáº·c sá»­ dá»¥ng project cÃ³ sáºµn
3. VÃ o SQL Editor
4. Copy toÃ n bá»™ ná»™i dung file nÃ y vÃ  paste vÃ o
5. Cháº¡y query
6. Kiá»ƒm tra cÃ¡c báº£ng Ä‘Ã£ Ä‘Æ°á»£c táº¡o trong Table Editor

LÆ¯U Ã:
- Password hash trong vÃ­ dá»¥ nÃ y lÃ  giáº£ Ä‘á»‹nh
- Trong production, sá»­ dá»¥ng Supabase Auth Ä‘á»ƒ xá»­ lÃ½ authentication
- Enable RLS policies theo nhu cáº§u báº£o máº­t cá»§a báº¡n
- Cáº­p nháº­t avatar_url vá»›i URL thá»±c táº¿ cá»§a áº£nh
*/
