-- Fix function search path mutable issues and RLS on existing tables
ALTER FUNCTION public.update_updated_at_column() SET search_path = '';
ALTER FUNCTION public.update_cliente_stats() SET search_path = '';
ALTER FUNCTION public.get_dias_estadia(TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE) SET search_path = '';
ALTER FUNCTION public.get_costo_estadia(TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE) SET search_path = '';
ALTER FUNCTION public.get_dias_vencido(TIMESTAMP WITH TIME ZONE) SET search_path = '';

-- Enable RLS on existing tables that were missed
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.n8n_chat_histories ENABLE ROW LEVEL SECURITY;

-- Create policies for existing tables
CREATE POLICY "Enable all access for users" ON public.documents FOR ALL USING (true);
CREATE POLICY "Enable all access for users" ON public.chat_sessions FOR ALL USING (true);
CREATE POLICY "Enable all access for users" ON public.n8n_chat_histories FOR ALL USING (true);