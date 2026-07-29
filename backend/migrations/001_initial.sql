-- Echo Meet - Initial Database Schema
-- Run this SQL in your Supabase SQL Editor at:
-- https://app.supabase.com → Select Project → SQL Editor

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS meetings (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_name       TEXT NOT NULL,
    daily_room_url  TEXT,
    started_at      TIMESTAMP DEFAULT NOW(),
    ended_at        TIMESTAMP,
    duration_seconds INTEGER,
    participant_count INTEGER DEFAULT 0,
    audio_file_path TEXT,
    transcript      JSONB,
    summary         TEXT,
    action_items    JSONB,
    created_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_meetings_room_name ON meetings(room_name);
CREATE INDEX IF NOT EXISTS idx_meetings_started_at ON meetings(started_at DESC);
