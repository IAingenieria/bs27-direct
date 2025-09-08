-- Add 'agencia' to the tipo_cliente enum in the clientes table
-- Run this in your Supabase SQL editor

-- First, check the current enum values
SELECT unnest(enum_range(NULL::tipo_cliente_enum)) AS tipo_cliente_values;

-- Add 'agencia' to the existing enum type
ALTER TYPE tipo_cliente_enum ADD VALUE 'agencia';

-- Verify the change
SELECT unnest(enum_range(NULL::tipo_cliente_enum)) AS tipo_cliente_values;
