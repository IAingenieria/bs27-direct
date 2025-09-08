-- Crear tabla para archivar cotizaciones generadas
CREATE TABLE IF NOT EXISTS generated_quotes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    quote_number TEXT NOT NULL UNIQUE,
    client_name TEXT NOT NULL,
    client_phone TEXT NOT NULL,
    client_email TEXT,
    vehicle_info TEXT,
    services TEXT,
    subtotal DECIMAL(10,2) NOT NULL,
    iva DECIMAL(10,2) NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    pdf_url TEXT,
    status TEXT NOT NULL DEFAULT 'generada' CHECK (status IN ('generada', 'enviada', 'aceptada', 'rechazada')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_generated_quotes_quote_number ON generated_quotes(quote_number);
CREATE INDEX IF NOT EXISTS idx_generated_quotes_client_name ON generated_quotes(client_name);
CREATE INDEX IF NOT EXISTS idx_generated_quotes_created_at ON generated_quotes(created_at);
CREATE INDEX IF NOT EXISTS idx_generated_quotes_status ON generated_quotes(status);

-- Crear función para generar número de cotización automático
CREATE OR REPLACE FUNCTION generate_quote_number()
RETURNS TEXT AS $$
DECLARE
    current_year TEXT;
    current_month TEXT;
    sequence_num INTEGER;
    quote_number TEXT;
BEGIN
    current_year := EXTRACT(YEAR FROM NOW())::TEXT;
    current_month := LPAD(EXTRACT(MONTH FROM NOW())::TEXT, 2, '0');
    
    -- Obtener el siguiente número secuencial para el mes actual
    SELECT COALESCE(MAX(CAST(SUBSTRING(quote_number FROM 8) AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM generated_quotes
    WHERE quote_number LIKE 'BS27' || current_year || current_month || '%';
    
    quote_number := 'BS27' || current_year || current_month || LPAD(sequence_num::TEXT, 3, '0');
    
    RETURN quote_number;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para actualizar updated_at
CREATE TRIGGER update_generated_quotes_updated_at 
    BEFORE UPDATE ON generated_quotes 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
