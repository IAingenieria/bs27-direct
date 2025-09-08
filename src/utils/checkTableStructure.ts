import { supabase } from '@/integrations/supabase/client';

export async function checkCotizacionesTable() {
  try {
    // First, check if the table exists
    const { data: tableExists, error: tableError } = await supabase
      .rpc('table_exists', { table_name: 'cotizaciones' });

    if (tableError) throw tableError;
    
    if (!tableExists) {
      console.error('❌ Error: cotizaciones table does not exist');
      return;
    }

    console.log('✅ cotizaciones table exists');

    // Get table structure
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, column_default, is_nullable')
      .eq('table_name', 'cotizaciones')
      .order('ordinal_position');

    if (columnsError) throw columnsError;

    console.log('\n📋 cotizaciones table structure:');
    console.table(columns);

    // Check for payment columns
    const paymentColumns = ['anticipo', 'pago1', 'liquidacion', 'total_pagado'];
    const missingColumns = paymentColumns.filter(col => 
      !columns?.some(c => c.column_name === col)
    );

    if (missingColumns.length > 0) {
      console.log('\n❌ Missing payment columns:', missingColumns.join(', '));
      
      // Create SQL to add missing columns
      const addColumnsSQL = missingColumns.map(col => {
        if (col === 'total_pagado') {
          return `ALTER TABLE cotizaciones 
                  ADD COLUMN IF NOT EXISTS ${col} DECIMAL(10,2) 
                  GENERATED ALWAYS AS (COALESCE(anticipo, 0) + COALESCE(pago1, 0) + COALESCE(liquidacion, 0)) STORED;`;
        } else {
          return `ALTER TABLE cotizaciones 
                  ADD COLUMN IF NOT EXISTS ${col} DECIMAL(10,2) DEFAULT 0;`;
        }
      });

      console.log('\n💡 Run this SQL to add missing columns:');
      console.log('----------------------------');
      console.log('BEGIN;');
      addColumnsSQL.forEach(sql => console.log(sql));
      console.log('COMMIT;');
      console.log('----------------------------');
    } else {
      console.log('\n✅ All payment columns exist in cotizaciones table');
    }

  } catch (error) {
    console.error('❌ Error checking table structure:', error);
  }
}

// Run the check
checkCotizacionesTable();
