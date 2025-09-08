-- Ensure payment columns exist in cotizaciones table
DO $$
BEGIN
    -- Add anticipo column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'cotizaciones' AND column_name = 'anticipo') THEN
        ALTER TABLE cotizaciones 
        ADD COLUMN anticipo DECIMAL(10,2) DEFAULT 0;
        
        COMMENT ON COLUMN cotizaciones.anticipo IS 'Monto del anticipo pagado';
        RAISE NOTICE 'Added column anticipo to cotizaciones table';
    END IF;
    
    -- Add pago1 column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'cotizaciones' AND column_name = 'pago1') THEN
        ALTER TABLE cotizaciones 
        ADD COLUMN pago1 DECIMAL(10,2) DEFAULT 0;
        
        COMMENT ON COLUMN cotizaciones.pago1 IS 'Primer pago adicional';
        RAISE NOTICE 'Added column pago1 to cotizaciones table';
    END IF;
    
    -- Add liquidacion column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'cotizaciones' AND column_name = 'liquidacion') THEN
        ALTER TABLE cotizaciones 
        ADD COLUMN liquidacion DECIMAL(10,2) DEFAULT 0;
        
        COMMENT ON COLUMN cotizaciones.liquidacion IS 'Pago final de liquidación';
        RAISE NOTICE 'Added column liquidacion to cotizaciones table';
    END IF;
    
    -- Add total_pagado generated column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'cotizaciones' AND column_name = 'total_pagado') THEN
        ALTER TABLE cotizaciones 
        ADD COLUMN total_pagado DECIMAL(10,2) 
        GENERATED ALWAYS AS (COALESCE(anticipo, 0) + COALESCE(pago1, 0) + COALESCE(liquidacion, 0)) STORED;
        
        COMMENT ON COLUMN cotizaciones.total_pagado IS 'Suma total de todos los pagos (automático)';
        RAISE NOTICE 'Added generated column total_pagado to cotizaciones table';
    END IF;
END $$;
