-- Crear tabla para gestionar estados de cotizaciones de WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_quotes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id TEXT NOT NULL UNIQUE,
    client_name TEXT NOT NULL,
    client_phone TEXT NOT NULL,
    client_email TEXT,
    vehicle_brand TEXT,
    vehicle_model TEXT,
    vehicle_year TEXT,
    status TEXT NOT NULL DEFAULT 'cotizar' CHECK (status IN ('aceptada', 'en_proceso', 'cotizar', 'perdida')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_quotes_status ON whatsapp_quotes(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_quotes_created_at ON whatsapp_quotes(created_at);
CREATE INDEX IF NOT EXISTS idx_whatsapp_quotes_session_id ON whatsapp_quotes(session_id);

-- Crear función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear trigger para actualizar updated_at
CREATE TRIGGER update_whatsapp_quotes_updated_at 
    BEFORE UPDATE ON whatsapp_quotes 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insertar datos de ejemplo (opcional)
-- INSERT INTO whatsapp_quotes (session_id, client_name, client_phone, client_email, vehicle_brand, vehicle_model, vehicle_year, status)
-- VALUES 
--     ('user:5218123456789', 'Sebastina Salinas', '+5218123456789', 'sebastina@example.com', 'BMW', 'X3', '2020', 'cotizar'),
--     ('user:5219876543210', 'Juan Pérez', '+5219876543210', 'juan@example.com', 'Toyota', 'Corolla', '2019', 'en_proceso');
