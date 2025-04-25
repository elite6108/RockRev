-- Add pdf_file column to toolbox_talks table if it doesn't exist
ALTER TABLE toolbox_talks
  ADD COLUMN IF NOT EXISTS pdf_file text;

-- Create index on pdf_file column for better query performance
CREATE INDEX IF NOT EXISTS idx_toolbox_talks_pdf_file ON toolbox_talks(pdf_file);