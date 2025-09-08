-- Check if the cotizaciones table exists
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE  table_schema = 'public'
   AND    table_name   = 'cotizaciones'
);

-- Describe the cotizaciones table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'cotizaciones';

-- Check if quote_number column exists
SELECT EXISTS (
   SELECT 1 
   FROM information_schema.columns 
   WHERE table_name='cotizaciones' AND column_name='quote_number'
);
