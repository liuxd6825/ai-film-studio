-- Migration: Add profile fields to character table
-- Run this manually or let GORM AutoMigrate handle it

ALTER TABLE character ADD COLUMN appearance TEXT;
ALTER TABLE character ADD COLUMN personality TEXT;
ALTER TABLE character ADD COLUMN background TEXT;
ALTER TABLE character ADD COLUMN abilities TEXT;
ALTER TABLE character ADD COLUMN faction VARCHAR(255);
