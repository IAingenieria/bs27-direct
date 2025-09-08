-- Cambiar el tipo de la columna quote_number a text
ALTER TABLE public.cotizaciones 
ALTER COLUMN quote_number TYPE TEXT;

-- Actualizar la restricción UNIQUE para la nueva definición de tipo
ALTER TABLE public.cotizaciones 
DROP CONSTRAINT IF EXISTS cotizaciones_quote_number_key;

ALTER TABLE public.cotizaciones 
ADD CONSTRAINT cotizaciones_quote_number_key UNIQUE (quote_number);
