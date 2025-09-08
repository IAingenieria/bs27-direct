-- Check if cotizaciones table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables 
              WHERE table_schema = 'public' AND table_name = 'cotizaciones') THEN
        RAISE NOTICE '✅ cotizaciones table exists';
        
        -- Check for payment columns
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'cotizaciones' AND column_name = 'anticipo') THEN
            RAISE NOTICE '❌ Column ''anticipo'' is missing';
            RAISE NOTICE 'Run this SQL to add it:';
            RAISE NOTICE 'ALTER TABLE cotizaciones ADD COLUMN anticipo DECIMAL(10,2) DEFAULT 0;';
        ELSE
            RAISE NOTICE '✅ Column ''anticipo'' exists';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'cotizaciones' AND column_name = 'pago1') THEN
            RAISE NOTICE '❌ Column ''pago1'' is missing';
            RAISE NOTICE 'Run this SQL to add it:';
            RAISE NOTICE 'ALTER TABLE cotizaciones ADD COLUMN pago1 DECIMAL(10,2) DEFAULT 0;';
        ELSE
            RAISE NOTICE '✅ Column ''pago1'' exists';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'cotizaciones' AND column_name = 'liquidacion') THEN
            RAISE NOTICE '❌ Column ''liquidacion'' is missing';
            RAISE NOTICE 'Run this SQL to add it:';
            RAISE NOTICE 'ALTER TABLE cotizaciones ADD COLUMN liquidacion DECIMAL(10,2) DEFAULT 0;';
        ELSE
            RAISE NOTICE '✅ Column ''liquidacion'' exists';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'cotizaciones' AND column_name = 'total_pagado') THEN
            RAISE NOTICE '❌ Column ''total_pagado'' is missing';
            RAISE NOTICE 'Run this SQL to add it (after adding the other columns):';
            RAISE NOTICE 'ALTER TABLE cotizaciones ADD COLUMN total_pagado DECIMAL(10,2) ';
            RAISE NOTICE 'GENERATED ALWAYS AS (COALESCE(anticipo, 0) + COALESCE(pago1, 0) + COALESCE(liquidacion, 0)) STORED;';
        ELSE
            RAISE NOTICE '✅ Column ''total_pagado'' exists';
        END IF;
    ELSE
        RAISE EXCEPTION '❌ Error: cotizaciones table does not exist';
    END IF;
END $$;

-- Show current structure
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
