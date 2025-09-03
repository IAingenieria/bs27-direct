-- Crear tabla para órdenes de taller con FOLIO
CREATE TABLE ordenes_taller (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  folio VARCHAR(50) UNIQUE NOT NULL,
  cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
  cotizacion_id UUID REFERENCES cotizaciones(id) ON DELETE SET NULL,
  vehiculo TEXT NOT NULL,
  problema_reportado TEXT,
  diagnostico TEXT,
  trabajos_realizados TEXT,
  status VARCHAR(20) DEFAULT 'recibida' CHECK (status IN ('recibida', 'diagnostico', 'reparacion', 'pruebas', 'lista', 'entregada')),
  fecha_ingreso TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  fecha_estimada_entrega DATE,
  fecha_entrega TIMESTAMP WITH TIME ZONE,
  monto_mano_obra DECIMAL(10,2) DEFAULT 0,
  monto_refacciones DECIMAL(10,2) DEFAULT 0,
  monto_total DECIMAL(10,2) GENERATED ALWAYS AS (monto_mano_obra + monto_refacciones) STORED,
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para optimizar consultas
CREATE INDEX idx_ordenes_taller_folio ON ordenes_taller(folio);
CREATE INDEX idx_ordenes_taller_cliente_id ON ordenes_taller(cliente_id);
CREATE INDEX idx_ordenes_taller_status ON ordenes_taller(status);
CREATE INDEX idx_ordenes_taller_fecha_ingreso ON ordenes_taller(fecha_ingreso);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ordenes_taller_updated_at 
    BEFORE UPDATE ON ordenes_taller 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Comentarios para documentación
COMMENT ON TABLE ordenes_taller IS 'Órdenes de trabajo del taller con FOLIO físico';
COMMENT ON COLUMN ordenes_taller.folio IS 'Número de FOLIO impreso físicamente en las órdenes del taller';
COMMENT ON COLUMN ordenes_taller.cliente_id IS 'Referencia al cliente propietario del vehículo';
COMMENT ON COLUMN ordenes_taller.cotizacion_id IS 'Referencia a la cotización relacionada (opcional)';
COMMENT ON COLUMN ordenes_taller.monto_total IS 'Monto total calculado automáticamente (mano de obra + refacciones)';
