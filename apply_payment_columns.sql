-- Script to add payment columns to cotizaciones table
-- Run this in your Supabase SQL editor

-- Check and add anticipo column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'cotizaciones' AND column_name = 'anticipo') THEN
        ALTER TABLE cotizaciones 
        ADD COLUMN anticipo DECIMAL(10,2) DEFAULT 0;
        
        COMMENT ON COLUMN cotizaciones.anticipo IS 'Monto del anticipo pagado';
        RAISE NOTICE 'Added column anticipo to cotizaciones table';
    ELSE
        RAISE NOTICE 'Column anticipo already exists in cotizaciones table';
    END IF;
END $$;

-- Check and add pago1 column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'cotizaciones' AND column_name = 'pago1') THEN
        ALTER TABLE cotizaciones 
        ADD COLUMN pago1 DECIMAL(10,2) DEFAULT 0;
        
        COMMENT ON COLUMN cotizaciones.pago1 IS 'Primer pago adicional';
        RAISE NOTICE 'Added column pago1 to cotizaciones table';
    ELSE
        RAISE NOTICE 'Column pago1 already exists in cotizaciones table';
    END IF;
END $$;

-- Check and add liquidacion column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'cotizaciones' AND column_name = 'liquidacion') THEN
        ALTER TABLE cotizaciones 
        ADD COLUMN liquidacion DECIMAL(10,2) DEFAULT 0;
        
        COMMENT ON COLUMN cotizaciones.liquidacion IS 'Pago final de liquidación';
        RAISE NOTICE 'Added column liquidacion to cotizaciones table';
    ELSE
        RAISE NOTICE 'Column liquidacion already exists in cotizaciones table';
    END IF;
END $$;

-- Check and add total_pagado generated column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'cotizaciones' AND column_name = 'total_pagado') THEN
        BEGIN
            ALTER TABLE cotizaciones 
            ADD COLUMN total_pagado DECIMAL(10,2) 
            GENERATED ALWAYS AS (COALESCE(anticipo, 0) + COALESCE(pago1, 0) + COALESCE(liquidacion, 0)) STORED;
            
            COMMENT ON COLUMN cotizaciones.total_pagado IS 'Suma total de todos los pagos (automático)';
            RAISE NOTICE 'Added generated column total_pagado to cotizaciones table';
        EXCEPTION WHEN others THEN
            RAISE NOTICE 'Error adding total_pagado column: %', SQLERRM;
        END;
    ELSE
        RAISE NOTICE 'Column total_pagado already exists in cotizaciones table';
    END IF;
END $$;

-- Verify the columns were added
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns 
WHERE table_name = 'cotizaciones'
AND column_name IN ('anticipo', 'pago1', 'liquidacion', 'total_pagado');
