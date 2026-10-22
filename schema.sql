CREATE TABLE IF NOT EXISTS app_profiles (
    username VARCHAR(64) ,
    pass VARCHAR(100) NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);