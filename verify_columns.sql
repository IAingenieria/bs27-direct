-- Verify payment columns in cotizaciones table
SELECT 
    column_name, 
    data_type, 
    column_default, 
    is_nullable
FROM 
    information_schema.columns 
WHERE 
    table_schema = 'public'
    AND table_name = 'cotizaciones'
    AND column_name IN ('anticipo', 'pago1', 'liquidacion', 'total_pagado')
ORDER BY 
    column_name;
