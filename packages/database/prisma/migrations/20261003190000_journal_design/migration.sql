-- Flexible journal design (custom colours, fonts, layout, book details) beyond the preset columns.
ALTER TABLE "JournalPreference" ADD COLUMN "design" JSONB NOT NULL DEFAULT '{}';
