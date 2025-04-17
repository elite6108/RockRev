-- Drop the pdf_file column from toolbox_talks table
ALTER TABLE toolbox_talks DROP COLUMN IF EXISTS pdf_file;

-- Drop the index if it exists
DROP INDEX IF EXISTS idx_toolbox_talks_pdf_file;