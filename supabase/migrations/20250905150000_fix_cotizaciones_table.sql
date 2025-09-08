-- Create the cotizaciones table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.cotizaciones (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
    vehiculo TEXT NOT NULL,
    problema TEXT NOT NULL,
    descripcion_trabajo TEXT,
    precio DECIMAL(10,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'enviada', 'aceptada', 'rechazada')),
    tipo_cliente TEXT NOT NULL DEFAULT 'individual' CHECK (tipo_cliente IN ('individual', 'empresa')),
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    fecha_envio TIMESTAMP WITH TIME ZONE,
    fecha_vencimiento TIMESTAMP WITH TIME ZONE,
    notas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    quote_number TEXT UNIQUE
);

-- Add the quote_number column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'cotizaciones' AND column_name = 'quote_number') THEN
        ALTER TABLE public.cotizaciones ADD COLUMN quote_number TEXT UNIQUE;
    END IF;
END $$;

-- Create a function to generate quote numbers
CREATE OR REPLACE FUNCTION public.generate_quote_number()
RETURNS TEXT AS $$
DECLARE
    current_year TEXT;
    current_month TEXT;
    sequence_num INTEGER;
    quote_num TEXT;
BEGIN
    current_year := EXTRACT(YEAR FROM NOW())::TEXT;
    current_month := LPAD(EXTRACT(MONTH FROM NOW())::TEXT, 2, '0');
    
    -- Get the next sequence number for the current month
    SELECT COALESCE(MAX(CAST(SUBSTRING(quote_number FROM 8) AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM public.cotizaciones
    WHERE quote_number LIKE 'BS27' || current_year || current_month || '%';
    
    -- Format the quote number: BS27YYYYMMXXX
    quote_num := 'BS27' || current_year || current_month || LPAD(sequence_num::TEXT, 3, '0');
    
    RETURN quote_num;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to set the quote_number before insert
CREATE OR REPLACE FUNCTION public.set_quote_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.quote_number IS NULL THEN
        NEW.quote_number := public.generate_quote_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_quote_number_trigger') THEN
        CREATE TRIGGER set_quote_number_trigger
        BEFORE INSERT ON public.cotizaciones
        FOR EACH ROW
        EXECUTE FUNCTION public.set_quote_number();
    END IF;
END $$;

-- Create a trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_cotizaciones_updated_at') THEN
        CREATE TRIGGER update_cotizaciones_updated_at
        BEFORE UPDATE ON public.cotizaciones
        FOR EACH ROW
        EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cotizaciones_cliente_id ON public.cotizaciones(cliente_id);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_quote_number ON public.cotizaciones(quote_number);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_status ON public.cotizaciones(status);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_fecha_creacion ON public.cotizaciones(fecha_creacion);
