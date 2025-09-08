-- Crear tabla de ingresos para registrar pagos
CREATE TABLE IF NOT EXISTS ingresos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cotizacion_id UUID REFERENCES cotizaciones(id) ON DELETE CASCADE,
    cliente_nombre TEXT NOT NULL,
    cliente_telefono TEXT,
    vehiculo TEXT NOT NULL,
    monto DECIMAL(10,2) NOT NULL,
    metodo_pago TEXT NOT NULL CHECK (metodo_pago IN ('efectivo', 'terminal_pos', 'transferencia')),
    status TEXT NOT NULL DEFAULT 'pendiente' CHECK (status IN ('cobrado', 'pendiente')),
    fecha_pago TIMESTAMP WITH TIME ZONE,
    notas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_ingresos_cotizacion_id ON ingresos(cotizacion_id);
CREATE INDEX IF NOT EXISTS idx_ingresos_status ON ingresos(status);
CREATE INDEX IF NOT EXISTS idx_ingresos_metodo_pago ON ingresos(metodo_pago);
CREATE INDEX IF NOT EXISTS idx_ingresos_created_at ON ingresos(created_at);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ingresos_updated_at 
    BEFORE UPDATE ON ingresos 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Comentarios para documentación
COMMENT ON TABLE ingresos IS 'Tabla para registrar ingresos/pagos de cotizaciones';
COMMENT ON COLUMN ingresos.cotizacion_id IS 'Referencia a la cotización asociada';
COMMENT ON COLUMN ingresos.monto IS 'Monto del ingreso en pesos mexicanos';
COMMENT ON COLUMN ingresos.metodo_pago IS 'Método de pago: efectivo, terminal_pos, transferencia';
COMMENT ON COLUMN ingresos.status IS 'Estado del pago: cobrado, pendiente';
COMMENT ON COLUMN ingresos.fecha_pago IS 'Fecha y hora cuando se realizó el pago (solo si status=cobrado)';
