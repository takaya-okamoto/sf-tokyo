-- Add thumbnail_path column to hearing_requests
ALTER TABLE hearing_requests
ADD COLUMN thumbnail_path TEXT;
