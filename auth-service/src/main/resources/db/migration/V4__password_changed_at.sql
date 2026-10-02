-- Logins issued before this moment are revoked (password changed or reset).
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP;
