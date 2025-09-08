-- Crear tabla para cotizaciones generadas
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
