hd,
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
