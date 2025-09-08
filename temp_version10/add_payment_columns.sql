-- Add payment tracking columns to generated_quotes table
ALTER TABLE generated_quotes 
ADD COLUMN IF NOT EXISTS anticipo DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS pago1 DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS liquidacion DECIMAL(10,2) DEFAULT 0;
