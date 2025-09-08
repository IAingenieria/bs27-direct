import { useEffect } from 'react';
import { checkCotizacionesTable } from '@/utils/checkTableStructure';

export default function CheckTable() {
  useEffect(() => {
    checkCotizacionesTable();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Checking cotizaciones table structure...</h1>
      <p>Please check your browser's developer console (F12) for the results.</p>
    </div>
  );
}
