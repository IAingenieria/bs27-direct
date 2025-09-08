-- Check the current structure of the cotizaciones table
SELECT 
    column_name, 
    data_type, 
    column_default, 
    is_nullable,
    (SELECT obj_description(('public.cotizaciones' || '.' || column_name)::regclass, 'pg_class')) as column_comment
FROM 
    information_schema.columns 
WHERE 
    table_name = 'cotizaciones'
ORDER BY 
    ordinal_position;
