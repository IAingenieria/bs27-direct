-- Crear tabla de diagnósticos técnicos
CREATE TABLE IF NOT EXISTS diagnosticos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    vehiculo_id UUID NOT NULL REFERENCES vehiculos(id) ON DELETE CASCADE,
    problema_detectado TEXT NOT NULL,
    descripcion_detallada TEXT NOT NULL,
    piezas_necesarias TEXT,
    tiempo_estimado TEXT,
    costo_estimado DECIMAL(10,2),
    prioridad TEXT CHECK (prioridad IN ('baja', 'media', 'alta', 'critica')) DEFAULT 'media',
    recomendaciones TEXT,
    tecnico_responsable TEXT,
    fecha_diagnostico TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_diagnosticos_vehiculo_id ON diagnosticos(vehiculo_id);
CREATE INDEX IF NOT EXISTS idx_diagnosticos_fecha ON diagnosticos(fecha_diagnostico);
CREATE INDEX IF NOT EXISTS idx_diagnosticos_prioridad ON diagnosticos(prioridad);

-- Habilitar RLS (Row Level Security)
ALTER TABLE diagnosticos ENABLE ROW LEVEL SECURITY;

-- Política para permitir todas las operaciones a usuarios autenticados
CREATE POLICY "Usuarios autenticados pueden gestionar diagnósticos" ON diagnosticos
    FOR ALL USING (auth.role() = 'authenticated');

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_diagnosticos_updated_at
    BEFORE UPDATE ON diagnosticos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comentarios para documentación
COMMENT ON TABLE diagnosticos IS 'Tabla para almacenar diagnósticos técnicos de vehículos en el taller';
COMMENT ON COLUMN diagnosticos.vehiculo_id IS 'Referencia al vehículo diagnosticado';
COMMENT ON COLUMN diagnosticos.problema_detectado IS 'Resumen del problema encontrado';
COMMENT ON COLUMN diagnosticos.descripcion_detallada IS 'Descripción técnica completa del diagnóstico';
COMMENT ON COLUMN diagnosticos.piezas_necesarias IS 'Lista de piezas o componentes necesarios';
COMMENT ON COLUMN diagnosticos.tiempo_estimado IS 'Tiempo estimado para la reparación';
COMMENT ON COLUMN diagnosticos.costo_estimado IS 'Costo estimado de la reparación';
COMMENT ON COLUMN diagnosticos.prioridad IS 'Prioridad de la reparación (baja, media, alta, critica)';
COMMENT ON COLUMN diagnosticos.recomendaciones IS 'Recomendaciones adicionales del técnico';
COMMENT ON COLUMN diagnosticos.tecnico_responsable IS 'Nombre del técnico que realizó el diagnóstico';
