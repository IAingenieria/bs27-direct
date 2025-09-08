-- Script to fix missing payment columns in cotizaciones table
-- Run each section one at a time in the Supabase SQL editor
-- Start with Section 1, then proceed to Section 2, etc.

-- ===== SECTION 1: Add anticipo column =====
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'cotizaciones' 
                  AND column_name = 'anticipo') THEN
        ALTER TABLE public.cotizaciones 
        ADD COLUMN IF NOT EXISTS anticipo DECIMAL(10,2) DEFAULT 0;
        
        COMMENT ON COLUMN public.cotizaciones.anticipo IS 'Monto del anticipo pagado';
        RAISE NOTICE '✅ Added column ''anticipo'' to cotizaciones table';
    ELSE
        RAISE NOTICE 'ℹ️ Column ''anticipo'' already exists in cotizaciones table';
    END IF;
END $$;

-- ===== SECTION 2: Add pago1 column =====
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'cotizaciones' 
                  AND column_name = 'pago1') THEN
        ALTER TABLE public.cotizaciones 
        ADD COLUMN IF NOT EXISTS pago1 DECIMAL(10,2) DEFAULT 0;
        
        COMMENT ON COLUMN public.cotizaciones.pago1 IS 'Primer pago adicional';
        RAISE NOTICE '✅ Added column ''pago1'' to cotizaciones table';
    ELSE
        RAISE NOTICE 'ℹ️ Column ''pago1'' already exists in cotizaciones table';
    END IF;
END $$;

-- ===== SECTION 3: Add liquidacion column =====
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'cotizaciones' 
                  AND column_name = 'liquidacion') THEN
        ALTER TABLE public.cotizaciones 
        ADD COLUMN IF NOT EXISTS liquidacion DECIMAL(10,2) DEFAULT 0;
        
        COMMENT ON COLUMN public.cotizaciones.liquidacion IS 'Pago final de liquidación';
        RAISE NOTICE '✅ Added column ''liquidacion'' to cotizaciones table';
    ELSE
        RAISE NOTICE 'ℹ️ Column ''liquidacion'' already exists in cotizaciones table';
    END IF;
END $$;

-- ===== SECTION 4: Add total_pagado generated column =====
-- Run this section only after the previous three sections have completed successfully
DO $$
BEGIN
    -- First, check if all required columns exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'cotizaciones' 
        AND column_name = 'total_pagado'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'cotizaciones' 
        AND column_name = 'anticipo'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'cotizaciones' 
        AND column_name = 'pago1'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'cotizaciones' 
        AND column_name = 'liquidacion'
    ) THEN
        BEGIN
            ALTER TABLE public.cotizaciones 
            ADD COLUMN IF NOT EXISTS total_pagado DECIMAL(10,2) 
            GENERATED ALWAYS AS (COALESCE(anticipo, 0) + COALESCE(pago1, 0) + COALESCE(liquidacion, 0)) STORED;
            
            COMMENT ON COLUMN public.cotizaciones.total_pagado IS 'Suma total de todos los pagos (automático)';
            RAISE NOTICE '✅ Added generated column ''total_pagado'' to cotizaciones table';
        EXCEPTION WHEN others THEN
            RAISE WARNING '⚠️ Could not add total_pagado column: %', SQLERRM;
        END;
    ELSE
        RAISE NOTICE 'ℹ️ Column ''total_pagado'' already exists or required columns are missing';
    END IF;
END $$;

-- ===== SECTION 5: Verify the changes =====
-- Run this section last to confirm all columns were added
SELECT 
    column_name, 
    data_type, 
    column_default, 
    is_nullable,
    CASE 
        WHEN column_name = 'anticipo' THEN 'Monto del anticipo pagado'
        WHEN column_name = 'pago1' THEN 'Primer pago adicional'
        WHEN column_name = 'liquidacion' THEN 'Pago final de liquidación'
        WHEN column_name = 'total_pagado' THEN 'Suma total de todos los pagos (automático)'
    END as column_comment
FROM 
    information_schema.columns 
WHERE 
    table_schema = 'public'
    AND table_name = 'cotizaciones'
    AND column_name IN ('anticipo', 'pago1', 'liquidacion', 'total_pagado')
ORDER BY 
    column_name;
