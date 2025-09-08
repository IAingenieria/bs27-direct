-- Add payment tracking columns to cotizaciones table
ALTER TABLE cotizaciones 
ADD COLUMN IF NOT EXISTS anticipo DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS pago1 DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS liquidacion DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_pagado DECIMAL(10,2) GENERATED ALWAYS AS (COALESCE(anticipo, 0) + COALESCE(pago1, 0) + COALESCE(liquidacion, 0)) STORED;

-- Add comments for documentation
COMMENT ON COLUMN cotizaciones.anticipo IS 'Monto del anticipo pagado';
COMMENT ON COLUMN cotizaciones.pago1 IS 'Primer pago adicional';
COMMENT ON COLUMN cotizaciones.liquidacion IS 'Pago final de liquidación';
COMMENT ON COLUMN cotizaciones.total_pagado IS 'Suma total de todos los pagos (automático)';

-- Create a function to update payment status based on payments
CREATE OR REPLACE FUNCTION update_payment_status()
RETURNS TRIGGER AS $$
BEGIN
    -- If the quote is being marked as accepted, ensure we have payment records
    IF NEW.status = 'aceptada' AND OLD.status != 'aceptada' THEN
        -- Create a payment record if one doesn't exist
        IF NOT EXISTS (SELECT 1 FROM ingresos WHERE cotizacion_id = NEW.id) THEN
            INSERT INTO ingresos (
                cotizacion_id,
                cliente_nombre,
                cliente_telefono,
                vehiculo,
                monto,
                metodo_pago,
                status,
                notas
            ) VALUES (
                NEW.id,
                (SELECT nombre FROM clientes WHERE id = NEW.cliente_id),
                (SELECT telefono FROM clientes WHERE id = NEW.cliente_id),
                NEW.vehiculo->>'marca' || ' ' || COALESCE(NEW.vehiculo->>'modelo', ''),
                NEW.precio,
                'efectivo', -- Default payment method
                'pendiente',
                'Pendiente de pago - Cotización aceptada'
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to handle payment status updates
CREATE OR REPLACE TRIGGER trg_update_payment_status
BEFORE UPDATE OF status ON cotizaciones
FOR EACH ROW
EXECUTE FUNCTION update_payment_status();

-- Update existing accepted quotes to ensure they have payment records
DO $$
BEGIN
    INSERT INTO ingresos (
        cotizacion_id,
        cliente_nombre,
        cliente_telefono,
        vehiculo,
        monto,
        metodo_pago,
        status,
        notas,
        created_at,
        updated_at
    ) 
    SELECT 
        c.id,
        cl.nombre,
        cl.telefono,
        c.vehiculo->>'marca' || ' ' || COALESCE(c.vehiculo->>'modelo', '') as vehiculo_desc,
        c.precio,
        'efectivo',
        'pendiente',
        'Pendiente de pago - Cotización aceptada',
        NOW(),
        NOW()
    FROM cotizaciones c
    JOIN clientes cl ON c.cliente_id = cl.id
    WHERE c.status = 'aceptada'
    AND NOT EXISTS (
        SELECT 1 FROM ingresos i 
        WHERE i.cotizacion_id = c.id
    );
EXCEPTION WHEN OTHERS THEN
    -- Ignore errors if the tables don't exist yet
    RAISE NOTICE 'Error updating existing quotes: %', SQLERRM;
END $$;
