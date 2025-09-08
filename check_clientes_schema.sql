-- Check the current schema of the clientes table
SELECT 
    column_name, 
    data_type, 
    column_default, 
    is_nullable,
    udt_name
FROM 
    information_schema.columns 
WHERE 
    table_schema = 'public'
    AND table_name = 'clientes'
ORDER BY 
    ordinal_position;

-- Check if there are any custom types (enums) in the database
SELECT 
    t.typname as enum_name,
    e.enumlabel as enum_value
FROM 
    pg_type t 
    JOIN pg_enum e ON t.oid = e.enumtypid  
    JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
WHERE 
    n.nspname = 'public'
ORDER BY 
    t.typname, e.enumsortorder;
