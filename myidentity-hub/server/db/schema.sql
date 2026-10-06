CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE users(id UUID PRIMARY KEY DEFAULT gen_random_uuid(), phone TEXT UNIQUE NOT NULL, name TEXT, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE otps(id SERIAL PRIMARY KEY, phone TEXT NOT NULL, purpose TEXT NOT NULL, code_hash TEXT NOT NULL, attempts INT DEFAULT 0, expires_at TIMESTAMPTZ NOT NULL);
CREATE TABLE social_accounts(id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID REFERENCES users ON DELETE CASCADE, provider TEXT NOT NULL, label TEXT, token_enc BYTEA, UNIQUE(user_id, provider));
CREATE TABLE documents(id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID REFERENCES users ON DELETE CASCADE, doc_type TEXT NOT NULL, number_masked TEXT, mime TEXT, file_path TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE audit_log(id BIGSERIAL PRIMARY KEY, user_id UUID, action TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT now());