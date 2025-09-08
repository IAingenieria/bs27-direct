-- Create a function to generate unique quote numbers
CREATE OR REPLACE FUNCTION public.generate_quote_number()
RETURNS TEXT AS $$
DECLARE
  new_quote_number TEXT;
  counter INTEGER := 1;
  max_attempts INTEGER := 10;
  is_unique BOOLEAN := FALSE;
BEGIN
  WHILE NOT is_unique AND counter <= max_attempts LOOP
    -- Generate a new quote number (format: BS27YYYYMMDDXXXX where X is a random digit)
    new_quote_number := 'BS27' || 
                        TO_CHAR(NOW() AT TIME ZONE 'America/Monterrey', 'YYYYMMDD') ||
                        LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    
    -- Check if the quote number already exists
    PERFORM 1 FROM public.cotizaciones WHERE quote_number = new_quote_number;
    
    -- If not found, it's unique
    IF NOT FOUND THEN
      is_unique := TRUE;
    END IF;
    
    counter := counter + 1;
  END LOOP;
  
  IF NOT is_unique THEN
    -- Fallback if we couldn't find a unique number after max attempts
    new_quote_number := 'BS27' || 
                       TO_CHAR(NOW() AT TIME ZONE 'America/Monterrey', 'YYYYMMDDHH24MISS') ||
                       LPAD(FLOOR(RANDOM() * 100)::TEXT, 2, '0');
  END IF;
  
  RETURN new_quote_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
