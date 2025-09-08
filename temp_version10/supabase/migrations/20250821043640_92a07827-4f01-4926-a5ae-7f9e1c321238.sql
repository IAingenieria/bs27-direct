-- Create enums for better data integrity
CREATE TYPE public.tipo_cliente AS ENUM ('individual', 'flotilla', 'revendedor');
CREATE TYPE public.status_cotizacion AS ENUM ('pendiente', 'en_proceso', 'enviada', 'aceptada', 'rechazada');
CREATE TYPE public.status_vehiculo AS ENUM ('recibido', 'en_proceso', 'listo_entrega', 'entregado');
CREATE TYPE public.tipo_notificacion AS ENUM ('whatsapp', 'pago', 'estadia', 'seguimiento');
CREATE TYPE public.tipo_contacto AS ENUM ('llamada', 'whatsapp', 'email', 'presencial');

-- Tabla Clientes
CREATE TABLE public.clientes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre TEXT NOT NULL,
    telefono TEXT NOT NULL,
    email TEXT,
    tipo_cliente tipo_cliente NOT NULL DEFAULT 'individual',
    fecha_registro TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    ultimo_contacto TIMESTAMP WITH TIME ZONE,
    proximo_seguimiento TIMESTAMP WITH TIME ZONE,
    valor_total DECIMAL(10,2) DEFAULT 0,
    trabajos_realizados INTEGER DEFAULT 0,
    notas TEXT,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabla Cotizaciones
CREATE TABLE public.cotizaciones (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
    vehiculo TEXT NOT NULL,
    problema TEXT NOT NULL,
    descripcion_trabajo TEXT,
    status status_cotizacion NOT NULL DEFAULT 'pendiente',
    precio DECIMAL(10,2) NOT NULL,
    fecha_creacion TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    fecha_envio TIMESTAMP WITH TIME ZONE,
    fecha_vencimiento TIMESTAMP WITH TIME ZONE,
    tipo_cliente tipo_cliente NOT NULL,
    notas TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabla Vehículos en Proceso
CREATE TABLE public.vehiculos (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
    cotizacion_id UUID REFERENCES public.cotizaciones(id) ON DELETE SET NULL,
    vehiculo TEXT NOT NULL,
    status status_vehiculo NOT NULL DEFAULT 'recibido',
    fecha_recibo TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    fecha_entrega TIMESTAMP WITH TIME ZONE,
    notas TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabla Pagos
CREATE TABLE public.pagos (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    cotizacion_id UUID NOT NULL REFERENCES public.cotizaciones(id) ON DELETE CASCADE,
    vehiculo_id UUID REFERENCES public.vehiculos(id) ON DELETE SET NULL,
    monto_total DECIMAL(10,2) NOT NULL,
    monto_pagado DECIMAL(10,2) DEFAULT 0,
    monto_pendiente DECIMAL(10,2) GENERATED ALWAYS AS (monto_total - monto_pagado) STORED,
    fecha_vencimiento TIMESTAMP WITH TIME ZONE,
    pagado BOOLEAN GENERATED ALWAYS AS (monto_pagado >= monto_total) STORED,
    metodo_pago TEXT,
    notas TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabla Notificaciones
CREATE TABLE public.notificaciones (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tipo tipo_notificacion NOT NULL,
    mensaje TEXT NOT NULL,
    cliente_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE,
    cotizacion_id UUID REFERENCES public.cotizaciones(id) ON DELETE CASCADE,
    vehiculo_id UUID REFERENCES public.vehiculos(id) ON DELETE CASCADE,
    urgente BOOLEAN DEFAULT false,
    fecha_creacion TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    fecha_programada TIMESTAMP WITH TIME ZONE,
    ejecutada BOOLEAN DEFAULT false,
    fecha_ejecucion TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabla Historial de Contactos
CREATE TABLE public.contactos (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
    tipo tipo_contacto NOT NULL,
    fecha TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    duracion INTEGER, -- en minutos
    notas TEXT,
    exitoso BOOLEAN DEFAULT true,
    proximo_seguimiento TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cotizaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehiculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contactos ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies (open access for now)
CREATE POLICY "Enable all access for users" ON public.clientes FOR ALL USING (true);
CREATE POLICY "Enable all access for users" ON public.cotizaciones FOR ALL USING (true);
CREATE POLICY "Enable all access for users" ON public.vehiculos FOR ALL USING (true);
CREATE POLICY "Enable all access for users" ON public.pagos FOR ALL USING (true);
CREATE POLICY "Enable all access for users" ON public.notificaciones FOR ALL USING (true);
CREATE POLICY "Enable all access for users" ON public.contactos FOR ALL USING (true);

-- Create indexes for better performance
CREATE INDEX idx_clientes_tipo ON public.clientes(tipo_cliente);
CREATE INDEX idx_clientes_fecha_registro ON public.clientes(fecha_registro);
CREATE INDEX idx_cotizaciones_cliente ON public.cotizaciones(cliente_id);
CREATE INDEX idx_cotizaciones_status ON public.cotizaciones(status);
CREATE INDEX idx_cotizaciones_fecha ON public.cotizaciones(fecha_creacion);
CREATE INDEX idx_vehiculos_cliente ON public.vehiculos(cliente_id);
CREATE INDEX idx_vehiculos_status ON public.vehiculos(status);
CREATE INDEX idx_pagos_cotizacion ON public.pagos(cotizacion_id);
CREATE INDEX idx_pagos_vencimiento ON public.pagos(fecha_vencimiento);
CREATE INDEX idx_notificaciones_urgente ON public.notificaciones(urgente);
CREATE INDEX idx_notificaciones_ejecutada ON public.notificaciones(ejecutada);
CREATE INDEX idx_contactos_cliente ON public.contactos(cliente_id);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_clientes_updated_at
    BEFORE UPDATE ON public.clientes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cotizaciones_updated_at
    BEFORE UPDATE ON public.cotizaciones
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vehiculos_updated_at
    BEFORE UPDATE ON public.vehiculos
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pagos_updated_at
    BEFORE UPDATE ON public.pagos
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notificaciones_updated_at
    BEFORE UPDATE ON public.notificaciones
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contactos_updated_at
    BEFORE UPDATE ON public.contactos
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Function to automatically update cliente stats when cotizaciones change
CREATE OR REPLACE FUNCTION public.update_cliente_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Update valor_total and trabajos_realizados for the client
    UPDATE public.clientes 
    SET 
        valor_total = (
            SELECT COALESCE(SUM(precio), 0) 
            FROM public.cotizaciones 
            WHERE cliente_id = COALESCE(NEW.cliente_id, OLD.cliente_id) 
            AND status = 'aceptada'
        ),
        trabajos_realizados = (
            SELECT COUNT(*) 
            FROM public.cotizaciones 
            WHERE cliente_id = COALESCE(NEW.cliente_id, OLD.cliente_id) 
            AND status = 'aceptada'
        ),
        ultimo_contacto = now()
    WHERE id = COALESCE(NEW.cliente_id, OLD.cliente_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update client stats
CREATE TRIGGER update_cliente_stats_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.cotizaciones
    FOR EACH ROW
    EXECUTE FUNCTION public.update_cliente_stats();

-- Function to calculate vehicle stay days (will be used in queries)
CREATE OR REPLACE FUNCTION public.get_dias_estadia(fecha_recibo TIMESTAMP WITH TIME ZONE, fecha_entrega TIMESTAMP WITH TIME ZONE DEFAULT NULL)
RETURNS INTEGER AS $$
BEGIN
    IF fecha_entrega IS NULL THEN
        RETURN EXTRACT(days FROM now() - fecha_recibo)::INTEGER;
    ELSE
        RETURN EXTRACT(days FROM fecha_entrega - fecha_recibo)::INTEGER;
    END IF;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to calculate vehicle stay cost
CREATE OR REPLACE FUNCTION public.get_costo_estadia(fecha_recibo TIMESTAMP WITH TIME ZONE, fecha_entrega TIMESTAMP WITH TIME ZONE DEFAULT NULL)
RETURNS DECIMAL(10,2) AS $$
DECLARE
    dias INTEGER;
BEGIN
    dias := public.get_dias_estadia(fecha_recibo, fecha_entrega);
    IF dias > 3 THEN
        RETURN (dias - 3) * 300;
    ELSE
        RETURN 0;
    END IF;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to calculate overdue days for payments
CREATE OR REPLACE FUNCTION public.get_dias_vencido(fecha_vencimiento TIMESTAMP WITH TIME ZONE)
RETURNS INTEGER AS $$
BEGIN
    IF fecha_vencimiento IS NULL THEN
        RETURN 0;
    ELSIF now() > fecha_vencimiento THEN
        RETURN EXTRACT(days FROM now() - fecha_vencimiento)::INTEGER;
    ELSE
        RETURN 0;
    END IF;
END;
$$ LANGUAGE plpgsql STABLE;