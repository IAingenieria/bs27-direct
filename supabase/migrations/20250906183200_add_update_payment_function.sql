-- Create or replace function to update payment fields
CREATE OR REPLACE FUNCTION actualizar_pago(
  p_quote_id UUID,
  p_field TEXT,
  p_value DECIMAL(10,2)
) 
RETURNS JSONB AS $$
DECLARE
  result JSONB;
  valid_fields TEXT[] := ARRAY['anticipo', 'pago1', 'liquidacion'];
  update_query TEXT;
BEGIN
  -- Validate field name
  IF NOT p_field = ANY(valid_fields) THEN
    RETURN jsonb_build_object('error', 'Campo de pago no válido');
  END IF;
  
  -- Build and execute dynamic update query
  update_query := format(
    'UPDATE cotizaciones 
     SET %I = $1, 
         updated_at = NOW() 
     WHERE id = $2 
     RETURNING id, anticipo, pago1, liquidacion',
    p_field
  );
  
  EXECUTE update_query INTO result USING p_value, p_quote_id;
  
  -- Update total_paid in the same transaction
  UPDATE cotizaciones 
  SET total_pagado = COALESCE(anticipo, 0) + COALESCE(pago1, 0) + COALESCE(liquidacion, 0)
  WHERE id = p_quote_id;
  
  RETURN result;
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION actualizar_pago(UUID, TEXT, DECIMAL) TO authenticated;
