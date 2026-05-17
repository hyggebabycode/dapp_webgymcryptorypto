-- =====================================================
-- SEED ONLY: no DROP/CREATE, safe to re-run
-- Assumes tables already exist.
-- =====================================================

-- Sample users (password = 123456, bcrypt hash)
INSERT INTO users (
    id,
    email,
    password_hash,
    full_name,
    phone,
    role,
    is_active,
    bio,
    avatar_url,
    gender,
    date_of_birth
) VALUES
    ('11111111-1111-1111-1111-111111111111', 'admin@gymheart.com', '$2b$10$zTKpxeWY2oHZDpPqAjEf6eAHOut/ch9t35YXeci/ecnIAqKuny5dm', 'admin', '0901234567', 'admin', true, 'Quản trị viên hệ thống GymHeart Fitness', 'https://ui-avatars.com/api/?name=Admin&background=f42559&color=fff&size=200', 'Nam', '1985-05-15'),
    ('22222222-2222-2222-2222-222222222222', 'coach@gymheart.com', '$2b$10$zTKpxeWY2oHZDpPqAjEf6eAHOut/ch9t35YXeci/ecnIAqKuny5dm', 'Trần Thị Nam', '0907654321', 'coach', true, 'Huấn luyện viên chuyên nghiệp', 'https://ui-avatars.com/api/?name=Coach&background=f42559&color=fff&size=200', 'Nữ', '1990-03-20'),
    ('33333333-3333-3333-3333-333333333333', 'user@gymheart.com', '$2b$10$zTKpxeWY2oHZDpPqAjEf6eAHOut/ch9t35YXeci/ecnIAqKuny5dm', 'Phạm Thị Lan Anh', '0912345678', 'user', true, 'Học viên GymHeart', 'https://ui-avatars.com/api/?name=User&background=f42559&color=fff&size=200', 'Nữ', '1995-08-10')
ON CONFLICT (email) DO UPDATE
SET
    password_hash = EXCLUDED.password_hash,
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    role = EXCLUDED.role,
    is_active = EXCLUDED.is_active,
    bio = EXCLUDED.bio,
    avatar_url = EXCLUDED.avatar_url,
    gender = EXCLUDED.gender,
    date_of_birth = EXCLUDED.date_of_birth;

-- Sample courses
INSERT INTO courses (
    id,
    course_name,
    description,
    price,
    duration_weeks,
    level,
    max_students,
    current_students,
    coach_id,
    is_active,
    start_date,
    end_date,
    image_url,
    created_by
) VALUES
    ('c0000001-0000-0000-0000-000000000001', 'Giảm Cân Thần Tốc 30 Ngày', 'Chương trình giảm cân khoa học và hiệu quả, kết hợp cardio và strength training', 2500000, 4, 'beginner', 15, 3, '22222222-2222-2222-2222-222222222222', true, '2026-02-10', '2026-03-10', 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800', '11111111-1111-1111-1111-111111111111'),
    ('c0000002-0000-0000-0000-000000000002', 'Tăng Cơ Bắp Chuyên Nghiệp', 'Lộ trình tập luyện tăng cơ chuyên nghiệp với compound và isolation exercises', 3500000, 8, 'intermediate', 12, 5, '22222222-2222-2222-2222-222222222222', true, '2026-02-15', '2026-04-15', 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800', '11111111-1111-1111-1111-111111111111'),
    ('c0000003-0000-0000-0000-000000000003', 'Yoga Và Flexibility', 'Khóa học Yoga kết hợp stretching giúp tăng cường sự linh hoạt và giảm stress', 1800000, 6, 'all_levels', 20, 8, '22222222-2222-2222-2222-222222222222', true, '2026-02-12', '2026-03-26', 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800', '11111111-1111-1111-1111-111111111111'),
    ('c0000004-0000-0000-0000-000000000004', 'HIIT Training - Đốt Mỡ Cực Mạnh', 'High Intensity Interval Training - đốt cháy mỡ thừa hiệu quả trong thời gian ngắn', 2800000, 6, 'intermediate', 15, 4, '22222222-2222-2222-2222-222222222222', true, '2026-02-17', '2026-03-31', 'https://images.unsplash.com/photo-1549576490-b0b4831ef60a?w=800', '11111111-1111-1111-1111-111111111111'),
    ('c0000005-0000-0000-0000-000000000005', 'Pilates Core Strength', 'Tăng cường sức mạnh vùng core, cải thiện tư thế và độ linh hoạt cơ thể', 2200000, 6, 'beginner', 18, 6, '22222222-2222-2222-2222-222222222222', true, '2026-02-20', '2026-04-03', 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800', '11111111-1111-1111-1111-111111111111'),
    ('c0000006-0000-0000-0000-000000000006', 'CrossFit Extreme', 'Chương trình CrossFit chuyên sâu cho người có nền tảng tốt', 4200000, 12, 'advanced', 10, 2, '22222222-2222-2222-2222-222222222222', true, '2026-02-25', '2026-05-25', 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800', '11111111-1111-1111-1111-111111111111')
ON CONFLICT (id) DO UPDATE
SET
    course_name = EXCLUDED.course_name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    duration_weeks = EXCLUDED.duration_weeks,
    level = EXCLUDED.level,
    max_students = EXCLUDED.max_students,
    current_students = EXCLUDED.current_students,
    coach_id = EXCLUDED.coach_id,
    is_active = EXCLUDED.is_active,
    start_date = EXCLUDED.start_date,
    end_date = EXCLUDED.end_date,
    image_url = EXCLUDED.image_url,
    created_by = EXCLUDED.created_by;

-- Schedules (insert if missing)
WITH seed_schedules (
    course_id,
    coach_id,
    title,
    description,
    day_of_week,
    start_time,
    end_time,
    location,
    room_number,
    max_capacity
) AS (
    VALUES
        ('c0000001-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'Cardio buổi sáng', 'Đốt cháy calo sáng sớm', 1, '06:00:00', '07:30:00', 'Khu C', 'Phòng Cardio', 15),
        ('c0000001-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'Cardio buổi sáng', 'Đốt cháy calo sáng sớm', 3, '06:00:00', '07:30:00', 'Khu C', 'Phòng Cardio', 15),
        ('c0000001-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'Cardio buổi sáng', 'Đốt cháy calo sáng sớm', 5, '06:00:00', '07:30:00', 'Khu C', 'Phòng Cardio', 15),
        ('c0000002-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'Tập tăng cơ', 'Luyện với tạ và máy', 2, '17:00:00', '19:00:00', 'Khu B', 'Phòng Gym', 12),
        ('c0000002-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'Tập tăng cơ', 'Luyện với tạ và máy', 4, '17:00:00', '19:00:00', 'Khu B', 'Phòng Gym', 12),
        ('c0000002-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'Tập tăng cơ', 'Luyện với tạ và máy', 6, '08:00:00', '10:00:00', 'Khu B', 'Phòng Gym', 12),
        ('c0000003-0000-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222', 'Yoga buổi tối', 'Thư giãn cơ thể', 1, '18:00:00', '19:30:00', 'Khu A', 'Phòng Yoga', 20),
        ('c0000003-0000-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222', 'Yoga buổi tối', 'Thư giãn cơ thể', 3, '18:00:00', '19:30:00', 'Khu A', 'Phòng Yoga', 20),
        ('c0000004-0000-0000-0000-000000000004', '22222222-2222-2222-2222-222222222222', 'HIIT buổi sáng', 'Đốt mỡ cực mạnh', 1, '06:00:00', '07:00:00', 'Khu C', 'Phòng Cardio', 15),
        ('c0000004-0000-0000-0000-000000000004', '22222222-2222-2222-2222-222222222222', 'HIIT buổi sáng', 'Đốt mỡ cực mạnh', 4, '06:00:00', '07:00:00', 'Khu C', 'Phòng Cardio', 15),
        ('c0000005-0000-0000-0000-000000000005', '22222222-2222-2222-2222-222222222222', 'Pilates Core', 'Tăng cường vùng core', 2, '18:30:00', '19:30:00', 'Khu A', 'Phòng Yoga', 18),
        ('c0000005-0000-0000-0000-000000000005', '22222222-2222-2222-2222-222222222222', 'Pilates Core', 'Tăng cường vùng core', 5, '18:30:00', '19:30:00', 'Khu A', 'Phòng Yoga', 18),
        ('c0000006-0000-0000-0000-000000000006', '22222222-2222-2222-2222-222222222222', 'CrossFit Extreme', 'Training chuyên sâu', 1, '17:00:00', '18:30:00', 'Khu B', 'Phòng CrossFit', 10),
        ('c0000006-0000-0000-0000-000000000006', '22222222-2222-2222-2222-222222222222', 'CrossFit Extreme', 'Training chuyên sâu', 3, '17:00:00', '18:30:00', 'Khu B', 'Phòng CrossFit', 10),
        ('c0000006-0000-0000-0000-000000000006', '22222222-2222-2222-2222-222222222222', 'CrossFit Extreme', 'Training chuyên sâu', 5, '17:00:00', '18:30:00', 'Khu B', 'Phòng CrossFit', 10)
)
INSERT INTO schedules (
    course_id,
    coach_id,
    title,
    description,
    day_of_week,
    start_time,
    end_time,
    location,
    room_number,
    max_capacity
)
SELECT
    seed_schedules.course_id::uuid,
    seed_schedules.coach_id::uuid,
    seed_schedules.title,
    seed_schedules.description,
    seed_schedules.day_of_week,
        seed_schedules.start_time::time,
        seed_schedules.end_time::time,
    seed_schedules.location,
    seed_schedules.room_number,
    seed_schedules.max_capacity
FROM seed_schedules
WHERE NOT EXISTS (
    SELECT 1
    FROM schedules s
    WHERE s.course_id = seed_schedules.course_id::uuid
      AND s.title = seed_schedules.title
      AND s.day_of_week = seed_schedules.day_of_week
            AND s.start_time = seed_schedules.start_time::time
            AND s.end_time = seed_schedules.end_time::time
);

-- Course lessons (insert if missing)
WITH seed_course_lessons (course_id, lesson_order, title, content, objectives) AS (
    VALUES
        ('c0000001-0000-0000-0000-000000000001', 1, 'Khởi động & Cardio nền tảng', 'Học cách khởi động đúng, thở và nhịp tim trong cardio.', 'Làm quen bài tập, kiểm soát nhịp tim'),
        ('c0000001-0000-0000-0000-000000000001', 2, 'Circuit đốt mỡ', 'Circuit kết hợp squat, burpee, plank, mountain climber.', 'Đốt mỡ và tăng sức bền'),
        ('c0000001-0000-0000-0000-000000000001', 3, 'Cardio cường độ cao', 'Interval chạy/đạp xe 1-2 phút, nghỉ chủ động.', 'Tăng hiệu suất tim mạch'),
        ('c0000001-0000-0000-0000-000000000001', 4, 'HIIT toàn thân', 'Interval 30s/30s, 4 vòng.', 'Tăng sức bền, đốt mỡ'),
        ('c0000001-0000-0000-0000-000000000001', 5, 'Đánh giá & duy trì', 'Test thể lực, kế hoạch duy trì sau khóa.', 'Giữ kết quả lâu dài'),
        ('c0000002-0000-0000-0000-000000000002', 1, 'Nền tảng tăng cơ', 'Hướng dẫn form chuẩn cho squat, bench, deadlift.', 'Nắm kỹ thuật compound'),
        ('c0000002-0000-0000-0000-000000000002', 2, 'Split thân trên', 'Tập ngực - vai - tay sau, kết hợp core.', 'Tăng sức mạnh thân trên'),
        ('c0000002-0000-0000-0000-000000000002', 3, 'Split thân dưới', 'Tập chân - mông - lưng dưới, kỹ thuật an toàn.', 'Tăng sức mạnh thân dưới'),
        ('c0000002-0000-0000-0000-000000000002', 4, 'Hypertrophy nâng cao', 'Volume cao, tập trung kiểm soát nhịp độ.', 'Tăng khối lượng cơ'),
        ('c0000002-0000-0000-0000-000000000002', 5, 'Deload & phục hồi', 'Giảm tải, mobility và phục hồi.', 'Tránh chấn thương'),
        ('c0000003-0000-0000-0000-000000000003', 1, 'Hơi thở & căn chỉnh', 'Hướng dẫn hít thở, tư thế đứng/ngồi đúng.', 'Cải thiện nhận thức cơ thể'),
        ('c0000003-0000-0000-0000-000000000003', 2, 'Chuỗi động tác cơ bản', 'Sun salutation, warrior, triangle.', 'Tăng độ linh hoạt'),
        ('c0000003-0000-0000-0000-000000000003', 3, 'Thư giãn & thiền', 'Kéo giãn sâu, thả lỏng, thiền ngắn.', 'Giảm stress, phục hồi'),
        ('c0000003-0000-0000-0000-000000000003', 4, 'Balance & core', 'Chuỗi tư thế thăng bằng, kích hoạt core.', 'Cải thiện thăng bằng'),
        ('c0000003-0000-0000-0000-000000000003', 5, 'Yin yoga', 'Giữ tư thế lâu, giãn sâu nhóm cơ lớn.', 'Thư giãn và phục hồi'),
        ('c0000004-0000-0000-0000-000000000004', 1, 'HIIT nền tảng', 'Giới thiệu nhịp tim mục tiêu và interval cơ bản.', 'Làm quen HIIT'),
        ('c0000004-0000-0000-0000-000000000004', 2, 'Sức mạnh + HIIT', 'Kết hợp tạ nhẹ và bài interval ngắn.', 'Tăng sức mạnh'),
        ('c0000004-0000-0000-0000-000000000004', 3, 'HIIT nâng cao', 'Chuỗi bài cường độ cao, nghỉ ngắn.', 'Tăng VO2'),
        ('c0000004-0000-0000-0000-000000000004', 4, 'EMOM/AMRAP', 'Bài tập dạng EMOM và AMRAP.', 'Cải thiện sức bền'),
        ('c0000004-0000-0000-0000-000000000004', 5, 'Test cuối khóa', 'Đánh giá tiến bộ bằng bài test HIIT.', 'Đo tiến bộ'),
        ('c0000005-0000-0000-0000-000000000005', 1, 'Pilates căn bản', 'Thở, kiểm soát core và tư thế chuẩn.', 'Kích hoạt core'),
        ('c0000005-0000-0000-0000-000000000005', 2, 'Stability', 'Bài tập ổn định khung chậu và cột sống.', 'Tăng ổn định'),
        ('c0000005-0000-0000-0000-000000000005', 3, 'Flexibility', 'Kéo giãn có kiểm soát, tăng linh hoạt.', 'Tăng độ dẻo'),
        ('c0000005-0000-0000-0000-000000000005', 4, 'Pilates với dụng cụ', 'Sử dụng vòng, bóng, dây kháng lực.', 'Tăng độ khó'),
        ('c0000005-0000-0000-0000-000000000005', 5, 'Chuỗi tổng hợp', 'Bài tập tổng hợp toàn thân.', 'Tăng sức bền cơ'),
        ('c0000006-0000-0000-0000-000000000006', 1, 'CrossFit fundamentals', 'Kỹ thuật squat, push, pull an toàn.', 'Nắm kỹ thuật nền'),
        ('c0000006-0000-0000-0000-000000000006', 2, 'Metcon cơ bản', 'WOD ngắn tăng nhịp tim.', 'Làm quen metcon'),
        ('c0000006-0000-0000-0000-000000000006', 3, 'Olympic basics', 'Kỹ thuật clean và press.', 'Tăng sức mạnh bùng nổ'),
        ('c0000006-0000-0000-0000-000000000006', 4, 'Gymnastics', 'Kỹ thuật pull-up, toes-to-bar.', 'Tăng kiểm soát cơ thể'),
        ('c0000006-0000-0000-0000-000000000006', 5, 'WOD benchmark', 'Thực hiện WOD chuẩn để đo tiến bộ.', 'Đánh giá tiến bộ')
)
INSERT INTO course_lessons (course_id, lesson_order, title, content, objectives)
SELECT
    seed_course_lessons.course_id::uuid,
    seed_course_lessons.lesson_order,
    seed_course_lessons.title,
    seed_course_lessons.content,
    seed_course_lessons.objectives
FROM seed_course_lessons
WHERE NOT EXISTS (
    SELECT 1
    FROM course_lessons cl
    WHERE cl.course_id = seed_course_lessons.course_id::uuid
      AND cl.lesson_order = seed_course_lessons.lesson_order
);

-- Lesson plans (insert if missing)
WITH seed_lesson_plans (course_id, coach_id, lesson_number, title, description, exercises, duration_minutes) AS (
    VALUES
        ('c0000001-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 1, 'Cardio nền tảng', 'Làm quen nhịp tim và kỹ thuật chạy/đạp xe.', ARRAY['Warm-up 10 phút', 'Run/Walk 20 phút', 'Cooldown 10 phút'], 40),
        ('c0000001-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 2, 'Circuit đốt mỡ', 'Circuit 4 bài, 3 vòng.', ARRAY['Squat', 'Burpee', 'Plank', 'Mountain climber'], 45),
        ('c0000001-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 3, 'HIIT toàn thân', 'Interval 30s/30s, 4 vòng.', ARRAY['Jump squat', 'High knees', 'Plank'], 35),
        ('c0000002-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 1, 'Compound basics', 'Tập form chuẩn 3 bài chính.', ARRAY['Back squat', 'Bench press', 'Deadlift'], 60),
        ('c0000002-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 2, 'Upper body', 'Ngực - vai - tay sau.', ARRAY['Incline press', 'Shoulder press', 'Triceps extension'], 55),
        ('c0000002-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 3, 'Lower body', 'Chân - mông - lưng dưới.', ARRAY['Squat', 'Romanian deadlift', 'Lunges'], 60),
        ('c0000002-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 4, 'Hypertrophy volume', 'Tăng volume, kiểm soát nhịp độ.', ARRAY['Leg press', 'Pull up', 'Dumbbell row'], 65),
        ('c0000003-0000-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222', 1, 'Yoga căn bản', 'Thư giãn và tăng linh hoạt.', ARRAY['Sun salutation', 'Warrior I/II', 'Child pose'], 50),
        ('c0000003-0000-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222', 2, 'Yoga flow', 'Chuỗi động tác liên hoàn.', ARRAY['Triangle', 'Down dog', 'Bridge'], 55),
        ('c0000003-0000-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222', 3, 'Balance & core', 'Tăng kiểm soát core và thăng bằng.', ARRAY['Tree pose', 'Boat pose', 'Side plank'], 55),
        ('c0000004-0000-0000-0000-000000000004', '22222222-2222-2222-2222-222222222222', 1, 'HIIT nền tảng', 'Interval cơ bản để làm quen cường độ.', ARRAY['Jumping jacks', 'High knees', 'Burpee'], 35),
        ('c0000004-0000-0000-0000-000000000004', '22222222-2222-2222-2222-222222222222', 2, 'EMOM', 'Bài tập EMOM 20 phút.', ARRAY['Push-up', 'Mountain climber', 'Air squat'], 40),
        ('c0000004-0000-0000-0000-000000000004', '22222222-2222-2222-2222-222222222222', 3, 'AMRAP', 'AMRAP 15 phút.', ARRAY['Box step-up', 'Plank', 'Jump squat'], 35),
        ('c0000005-0000-0000-0000-000000000005', '22222222-2222-2222-2222-222222222222', 1, 'Pilates core', 'Kích hoạt core và kiểm soát nhịp thở.', ARRAY['The hundred', 'Single leg stretch', 'Pelvic curl'], 45),
        ('c0000005-0000-0000-0000-000000000005', '22222222-2222-2222-2222-222222222222', 2, 'Stability & mobility', 'Ổn định khung chậu và tăng linh hoạt.', ARRAY['Spine stretch', 'Side leg lift', 'Saw'], 50),
        ('c0000006-0000-0000-0000-000000000006', '22222222-2222-2222-2222-222222222222', 1, 'CrossFit fundamentals', 'Kỹ thuật cơ bản và an toàn.', ARRAY['Air squat', 'Push press', 'Ring row'], 60),
        ('c0000006-0000-0000-0000-000000000006', '22222222-2222-2222-2222-222222222222', 2, 'Metcon cơ bản', 'WOD ngắn tăng nhịp tim.', ARRAY['Burpee', 'Kettlebell swing', 'Sit-up'], 45)
)
INSERT INTO lesson_plans (course_id, coach_id, lesson_number, title, description, exercises, duration_minutes)
SELECT
    seed_lesson_plans.course_id::uuid,
    seed_lesson_plans.coach_id::uuid,
    seed_lesson_plans.lesson_number,
    seed_lesson_plans.title,
    seed_lesson_plans.description,
    seed_lesson_plans.exercises,
    seed_lesson_plans.duration_minutes
FROM seed_lesson_plans
WHERE NOT EXISTS (
    SELECT 1
    FROM lesson_plans lp
    WHERE lp.course_id = seed_lesson_plans.course_id::uuid
      AND lp.lesson_number = seed_lesson_plans.lesson_number
);

-- Quick sanity checks
SELECT COUNT(*) AS total_courses FROM courses;
SELECT COUNT(*) AS total_schedules FROM schedules;
SELECT COUNT(*) AS total_course_lessons FROM course_lessons;
SELECT COUNT(*) AS total_lesson_plans FROM lesson_plans;
