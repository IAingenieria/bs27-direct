-- Fix: Add 'agencia' to tipo_cliente enum
-- Run this in your Supabase SQL editor

-- Add 'agencia' to the existing enum type
ALTER TYPE tipo_cliente_enum ADD VALUE IF NOT EXISTS 'agencia';

-- Verify the enum now includes all values
SELECT unnest(enum_range(NULL::tipo_cliente_enum)) AS available_values;
