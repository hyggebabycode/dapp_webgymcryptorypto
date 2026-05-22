-- QR attendance check-in support for GymHeart.
-- Run this after the main database setup.

CREATE TABLE IF NOT EXISTS attendance_checkins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enrollment_id UUID NOT NULL REFERENCES class_enrollments(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    schedule_id UUID REFERENCES schedules(id) ON DELETE SET NULL,
    checkin_date DATE NOT NULL DEFAULT CURRENT_DATE,
    checkin_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    checked_by UUID REFERENCES users(id) ON DELETE SET NULL,
    method TEXT NOT NULL DEFAULT 'qr',
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(enrollment_id, checkin_date)
);

CREATE INDEX IF NOT EXISTS idx_attendance_checkins_date
ON attendance_checkins(checkin_date);

CREATE INDEX IF NOT EXISTS idx_attendance_checkins_course_date
ON attendance_checkins(course_id, checkin_date);

CREATE INDEX IF NOT EXISTS idx_attendance_checkins_user
ON attendance_checkins(user_id);

ALTER TABLE attendance_checkins DISABLE ROW LEVEL SECURITY;
