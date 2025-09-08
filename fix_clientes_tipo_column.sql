-- Fix the tipo_cliente column to support 'agencia' value
-- This script handles different scenarios for the column type

-- First, check if the column uses a CHECK constraint instead of an enum
SELECT 
    column_name, 
    data_type, 
    column_default, 
    is_nullable
FROM 
    information_schema.columns 
WHERE 
    table_schema = 'public'
    AND table_name = 'clientes'
    AND column_name = 'tipo_cliente';

-- Check for existing CHECK constraints on the tipo_cliente column
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM 
    pg_constraint 
WHERE 
    conrelid = 'public.clientes'::regclass
    AND conname LIKE '%tipo_cliente%';

-- Option 1: If it's a text column with CHECK constraint, drop and recreate the constraint
DO $$
BEGIN
    -- Drop existing CHECK constraint if it exists
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conrelid = 'public.clientes'::regclass 
        AND conname LIKE '%tipo_cliente%'
    ) THEN
        -- Get the constraint name and drop it
        EXECUTE (
            SELECT 'ALTER TABLE public.clientes DROP CONSTRAINT ' || conname
            FROM pg_constraint 
            WHERE conrelid = 'public.clientes'::regclass 
            AND conname LIKE '%tipo_cliente%'
            LIMIT 1
        );
        RAISE NOTICE 'Dropped existing tipo_cliente constraint';
    END IF;
    
    -- Add new CHECK constraint that includes 'agencia'
    ALTER TABLE public.clientes 
    ADD CONSTRAINT clientes_tipo_cliente_check 
    CHECK (tipo_cliente IN ('individual', 'flotilla', 'revendedor', 'agencia'));
    
    RAISE NOTICE 'Added new constraint with agencia support';
    
EXCEPTION WHEN others THEN
    RAISE NOTICE 'Error updating constraint: %', SQLERRM;
END $$;

-- Verify the change
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM 
    pg_constraint 
WHERE 
    conrelid = 'public.clientes'::regclass
    AND conname LIKE '%tipo_cliente%';
