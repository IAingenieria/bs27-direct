import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTable() {
  try {
    // Check if table exists
    const { data: tableExists, error: tableError } = await supabase
      .rpc('table_exists', { table_name: 'cotizaciones' });
    
    console.log('Table exists:', tableExists);
    
    if (tableExists) {
      // Get table structure
      const { data: columns, error: columnsError } = await supabase
        .rpc('get_columns', { table_name: 'cotizaciones' });
      
      console.log('Table columns:', columns);
      
      // Check if quote_number column exists
      const hasQuoteNumber = columns?.some((col: any) => col.column_name === 'quote_number');
      console.log('Has quote_number column:', hasQuoteNumber);
      
      if (!hasQuoteNumber) {
        console.log('Adding quote_number column...');
        const { data: alterResult, error: alterError } = await supabase
          .rpc('add_column_if_not_exists', { 
            table_name: 'cotizaciones',
            column_name: 'quote_number',
            column_type: 'TEXT'
          });
          
        console.log('Column added:', alterResult, 'Error:', alterError);
      }
    }
  } catch (error) {
    console.error('Error checking table:', error);
  }
}

checkTable();
