-- Add blockchain transaction hash tracking for MetaMask / Smart Contract payments.

ALTER TABLE class_enrollments
ADD COLUMN IF NOT EXISTS tx_hash TEXT;

CREATE INDEX IF NOT EXISTS idx_enrollments_tx_hash
ON class_enrollments(tx_hash);

COMMENT ON COLUMN class_enrollments.tx_hash IS
'Blockchain transaction hash for Oasis Sapphire Testnet course payments.';
