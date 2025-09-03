-- Actualizar tabla ordenes_taller para incluir fechas por fase y campos adicionales del vehículo
ALTER TABLE ordenes_taller 
ADD COLUMN marca TEXT,
ADD COLUMN modelo TEXT,
ADD COLUMN año INTEGER,
ADD COLUMN placas TEXT,
ADD COLUMN color TEXT,
ADD COLUMN fecha_recibido TIMESTAMP WITH TIME ZONE,
ADD COLUMN fecha_diagnostico TIMESTAMP WITH TIME ZONE,
ADD COLUMN fecha_cotizacion_aprobada TIMESTAMP WITH TIME ZONE,
ADD COLUMN fecha_en_proceso TIMESTAMP WITH TIME ZONE,
ADD COLUMN fecha_listo_entrega TIMESTAMP WITH TIME ZONE,
ADD COLUMN fecha_entregado TIMESTAMP WITH TIME ZONE,
ADD COLUMN dias_estadia_cargo INTEGER DEFAULT 0,
ADD COLUMN monto_cargo_estadia DECIMAL(10,2) DEFAULT 0;

-- Actualizar el enum de status para incluir las nuevas fases
ALTER TABLE ordenes_taller 
DROP CONSTRAINT ordenes_taller_status_check;

ALTER TABLE ordenes_taller 
ADD CONSTRAINT ordenes_taller_status_check 
CHECK (status IN ('recibido', 'diagnostico', 'cotizacion_aprobada', 'en_proceso', 'listo_entrega', 'entregado'));

-- Función para calcular días de estadía y cargo automático
CREATE OR REPLACE FUNCTION calcular_cargo_estadia(orden_id UUID)
RETURNS TABLE(dias_exceso INTEGER, cargo_total DECIMAL) AS $$
DECLARE
    fecha_listo TIMESTAMP WITH TIME ZONE;
    dias_transcurridos INTEGER;
    dias_exceso_calc INTEGER;
    cargo_diario DECIMAL := 150.00;
BEGIN
    -- Obtener fecha cuando se marcó como listo para entrega
    SELECT fecha_listo_entrega INTO fecha_listo
    FROM ordenes_taller 
    WHERE id = orden_id;
    
    IF fecha_listo IS NULL THEN
        RETURN QUERY SELECT 0, 0.00::DECIMAL;
        RETURN;
    END IF;
    
    -- Calcular días transcurridos desde que está listo
    dias_transcurridos := EXTRACT(DAY FROM NOW() - fecha_listo)::INTEGER;
    
    -- Calcular días de exceso (después del día 3)
    dias_exceso_calc := GREATEST(0, dias_transcurridos - 3);
    
    RETURN QUERY SELECT dias_exceso_calc, (dias_exceso_calc * cargo_diario)::DECIMAL;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar fechas automáticamente al cambiar status
CREATE OR REPLACE FUNCTION update_status_timestamps()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo actualizar si el status cambió
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        CASE NEW.status
            WHEN 'recibido' THEN
                NEW.fecha_recibido = NOW();
            WHEN 'diagnostico' THEN
                NEW.fecha_diagnostico = NOW();
            WHEN 'cotizacion_aprobada' THEN
                NEW.fecha_cotizacion_aprobada = NOW();
            WHEN 'en_proceso' THEN
                NEW.fecha_en_proceso = NOW();
            WHEN 'listo_entrega' THEN
                NEW.fecha_listo_entrega = NOW();
            WHEN 'entregado' THEN
                NEW.fecha_entregado = NOW();
        END CASE;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_status_timestamps
    BEFORE UPDATE ON ordenes_taller
    FOR EACH ROW
    EXECUTE FUNCTION update_status_timestamps();

-- Índices adicionales para optimizar consultas
CREATE INDEX idx_ordenes_taller_status_fecha ON ordenes_taller(status, fecha_listo_entrega);
CREATE INDEX idx_ordenes_taller_marca_modelo ON ordenes_taller(marca, modelo);

-- Comentarios para documentación
COMMENT ON COLUMN ordenes_taller.marca IS 'Marca del vehículo (ej: Honda, Toyota)';
COMMENT ON COLUMN ordenes_taller.modelo IS 'Modelo del vehículo (ej: Civic, Corolla)';
COMMENT ON COLUMN ordenes_taller.año IS 'Año del vehículo';
COMMENT ON COLUMN ordenes_taller.placas IS 'Placas del vehículo';
COMMENT ON COLUMN ordenes_taller.color IS 'Color del vehículo';
COMMENT ON COLUMN ordenes_taller.dias_estadia_cargo IS 'Días de estadía que generan cargo adicional';
COMMENT ON COLUMN ordenes_taller.monto_cargo_estadia IS 'Monto total por cargo de estadía ($150/día después del 3er día)';
