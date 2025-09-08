-- Fix the tipo_cliente enum to include 'agencia'
-- The enum exists but might have a different name

-- First, find the actual enum name
SELECT 
    t.typname as enum_name,
    array_agg(e.enumlabel ORDER BY e.enumsortorder) as enum_values
FROM 
    pg_type t 
    JOIN pg_enum e ON t.oid = e.enumtypid  
    JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
WHERE 
    n.nspname = 'public'
    AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clientes' 
        AND column_name = 'tipo_cliente' 
        AND udt_name = t.typname
    )
GROUP BY t.typname;

-- Add 'agencia' to the tipo_cliente enum (the actual enum name might be different)
DO $$
DECLARE
    enum_name text;
BEGIN
    -- Get the actual enum name used by the tipo_cliente column
    SELECT udt_name INTO enum_name
    FROM information_schema.columns 
    WHERE table_schema = 'public'
      AND table_name = 'clientes' 
      AND column_name = 'tipo_cliente';
    
    IF enum_name IS NOT NULL THEN
        -- Add 'agencia' to the enum if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM pg_enum e
            JOIN pg_type t ON e.enumtypid = t.oid
            WHERE t.typname = enum_name AND e.enumlabel = 'agencia'
        ) THEN
            EXECUTE format('ALTER TYPE %I ADD VALUE %L', enum_name, 'agencia');
            RAISE NOTICE 'Added ''agencia'' to enum %', enum_name;
        ELSE
            RAISE NOTICE 'Value ''agencia'' already exists in enum %', enum_name;
        END IF;
    ELSE
        RAISE NOTICE 'Could not find enum type for tipo_cliente column';
    END IF;
END $$;

-- Verify the enum now includes 'agencia'
SELECT 
    t.typname as enum_name,
    array_agg(e.enumlabel ORDER BY e.enumsortorder) as enum_values
FROM 
    pg_type t 
    JOIN pg_enum e ON t.oid = e.enumtypid  
    JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
WHERE 
    n.nspname = 'public'
    AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clientes' 
        AND column_name = 'tipo_cliente' 
        AND udt_name = t.typname
    )
GROUP BY t.typname;
