-- =====================================================
-- GYMHEART NEXT.JS HARDENING MIGRATION
-- Chạy trong Supabase SQL Editor sau database_setup.sql
-- =====================================================

-- Lưu ví MetaMask tách riêng khỏi địa chỉ nhà/ghi chú.
ALTER TABLE users
ADD COLUMN IF NOT EXISTS wallet_address TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_wallet_address
ON users (LOWER(wallet_address))
WHERE wallet_address IS NOT NULL AND wallet_address <> '';

-- Theo dõi yêu cầu đăng ký làm PT rõ hơn.
ALTER TABLE users
ADD COLUMN IF NOT EXISTS pt_request_status TEXT DEFAULT 'none',
ADD COLUMN IF NOT EXISTS pt_request_note TEXT;

-- Đảm bảo bảng đăng ký lưu được mã giao dịch blockchain.
ALTER TABLE class_enrollments
ADD COLUMN IF NOT EXISTS tx_hash TEXT;

CREATE INDEX IF NOT EXISTS idx_enrollments_tx_hash
ON class_enrollments(tx_hash);

CREATE UNIQUE INDEX IF NOT EXISTS uq_enrollments_tx_hash
ON class_enrollments(tx_hash)
WHERE tx_hash IS NOT NULL AND tx_hash <> '';

-- Lưu đối soát thanh toán Web3 bằng TEST thay vì chỉ nhìn số tiền VND cũ.
ALTER TABLE class_enrollments
ADD COLUMN IF NOT EXISTS payment_token_amount DECIMAL(18, 8),
ADD COLUMN IF NOT EXISTS payment_currency TEXT DEFAULT 'TEST',
ADD COLUMN IF NOT EXISTS payer_wallet TEXT;

CREATE INDEX IF NOT EXISTS idx_enrollments_payer_wallet
ON class_enrollments(LOWER(payer_wallet))
WHERE payer_wallet IS NOT NULL AND payer_wallet <> '';

-- Backfill trạng thái yêu cầu PT cho dữ liệu cũ.

UPDATE users
SET pt_request_status = 'pending'
WHERE requested_role = 'coach'
  AND role <> 'coach'
  AND (pt_request_status IS NULL OR pt_request_status = 'none');

UPDATE users
SET pt_request_status = 'approved'
WHERE role = 'coach'
  AND (pt_request_status IS NULL OR pt_request_status = 'none');

-- Giỏ hàng server-side cho user đã đăng nhập.
CREATE TABLE IF NOT EXISTS cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_course_id ON cart_items(course_id);

-- Nhật ký thao tác quan trọng để admin đối soát thay đổi.
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
