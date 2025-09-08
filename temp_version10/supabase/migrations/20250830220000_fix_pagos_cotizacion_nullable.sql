-- Fix pagos table to make cotizacion_id nullable
-- This allows payments without a specific cotizacion

ALTER TABLE public.pagos 
ALTER COLUMN cotizacion_id DROP NOT NULL;

-- Add comment to document the change
COMMENT ON COLUMN public.pagos.cotizacion_id IS 'Referencia opcional a la cotización asociada (puede ser NULL para pagos directos)';
