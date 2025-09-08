-- Primero, asegurémonos de que el tipo enum exista
CREATE TYPE tipo_cliente_enum AS ENUM ('individual', 'flotilla', 'revendedor');

-- Actualizar la tabla cotizaciones para usar el mismo tipo enum
ALTER TABLE public.cotizaciones 
ALTER COLUMN tipo_cliente TYPE tipo_cliente_enum 
USING (
  CASE 
    WHEN tipo_cliente = 'empresa' THEN 'individual'::tipo_cliente_enum 
    ELSE tipo_cliente::tipo_cliente_enum 
  END
);

-- Actualizar la restricción CHECK para que coincida con el enum
ALTER TABLE public.cotizaciones 
DROP CONSTRAINT IF EXISTS cotizaciones_tipo_cliente_check;

-- Asegurarse de que el valor por defecto esté establecido correctamente
ALTER TABLE public.cotizaciones 
ALTER COLUMN tipo_cliente SET DEFAULT 'individual'::tipo_cliente_enum;
