-- Migration: Add is_cover column and composite index to visual_image
-- This migration adds the is_cover boolean field and creates a composite index
-- for efficient cover image lookups by visual object.
--
-- Run this manually if GORM AutoMigrate doesn't create the index properly:
--
-- SQLite:
--   ALTER TABLE visual_image ADD COLUMN is_cover BOOLEAN DEFAULT FALSE;
--   CREATE INDEX idx_visual_image_visual_object_is_cover ON visual_image (visual_object_id, is_cover);
--
-- MySQL/PostgreSQL:
--   ALTER TABLE visual_image ADD COLUMN is_cover BOOLEAN DEFAULT FALSE;
--   CREATE INDEX idx_visual_image_visual_object_is_cover ON visual_image (visual_object_id, is_cover);

-- Verify the column was added (for SQLite, this is a no-op if column exists)
-- PRAGMA table_info(visual_image);

-- Verify the index exists
-- PRAGMA index_list(visual_image);
