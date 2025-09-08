import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

interface QuotePreviewProps {
  data: any;
  onClose: () => void;
}

// Client-side only component to avoid SSR issues
const ClientSideQuotePreview: React.FC<QuotePreviewProps> = ({ data, onClose }) => {
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      timeZone: 'America/Monterrey'
    };
    return new Date(date).toLocaleDateString('es-MX', options);
  };

  if (!data || !isClient) return null;

  const content = (
    <div className="w-full font-sans" style={{ maxWidth: '8.5in' }}>
      <div 
        id="quote-preview-content" 
        className="bg-white p-8 print:p-0"
        style={{ minHeight: '10in' }}
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 focus:outline-none"
          aria-label="Cerrar"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <div className="text-left">
              <h1 className="text-4xl font-bold text-gray-900 mb-1">BS27 GARAGE</h1>
              <p className="text-sm text-gray-600">Servicio Especializado en Vehículos</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-900">
                <span className="font-bold">Cotización #</span> {data.quote_number}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-semibold">Fecha:</span> {formatDate(new Date())}
              </p>
            </div>
          </div>
          
          {/* Title with red underline */}
          <div className="mt-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 inline-block border-b-4 border-red-600 pb-1">
              COTIZACIÓN
            </h2>
          </div>
        </div>

        {/* Client and Vehicle Info */}
        <div className="grid grid-cols-2 gap-8 mb-8 text-sm">
          <div>
            <h3 className="text-base font-bold text-gray-700 mb-2 border-b border-gray-300 pb-1">
              DATOS DEL CLIENTE
            </h3>
            <p className="font-semibold text-gray-800">{data.client_name}</p>
            <p className="text-gray-700">Tel: {data.client_phone}</p>
            {data.client_email && (
              <p className="text-gray-700">Email: {data.client_email}</p>
            )}
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-700 mb-2 border-b border-gray-300 pb-1">
              DATOS DEL VEHÍCULO
            </h3>
            <p className="font-semibold text-gray-800">{data.vehicle_info}</p>
          </div>
        </div>

        {/* Services Table */}
        <div className="mb-6">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-800 text-white text-left text-sm">
                <th className="p-3 font-semibold">DESCRIPCIÓN DEL SERVICIO</th>
                <th className="p-3 font-semibold text-right">PRECIO</th>
              </tr>
            </thead>
            <tbody>
              {data.services.map((item: any, index: number) => (
                <tr key={index} className="border-b border-gray-200">
                  <td className="p-3 text-gray-800">{item.description}</td>
                  <td className="p-3 text-right font-medium">${parseFloat(item.price).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end mb-8">
          <div className="w-full max-w-xs">
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="text-gray-700">SUBTOTAL:</span>
              <span className="font-semibold">${parseFloat(data.subtotal).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="text-gray-700">IVA (16%):</span>
              <span className="font-semibold">${parseFloat(data.iva).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between py-3 bg-gray-100 px-3 mt-2">
              <span className="text-lg font-bold text-gray-900">TOTAL:</span>
              <span className="text-lg font-bold text-gray-900">${parseFloat(data.total).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-4">
          {/* Double line separator */}
          <div className="border-t-2 border-gray-300 mb-4">
            <div className="border-t-2 border-gray-300 mt-1"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs text-gray-600 print:grid-cols-2">
            {/* Left Column - Payment Information */}
            <div>
              <p className="font-semibold text-sm mb-2">MÉTODOS DE PAGO</p>
              <p className="mb-3">Efectivo, Terminal PV, Transferencias</p>
              
              <p className="font-medium mb-1">INFORMACIÓN PARA TRANSFERENCIAS:</p>
              <div className="space-y-1 mb-3">
                <p>Nombre del Beneficiario: EDUARDO AYALA CASTILLEJA</p>
                <p>BANCO: BBVA</p>
                <p>CLABE INTERBANCARIA: 0125 8000 4845 5359 43</p>
                <p>TARJETA: 4152 3141 5148 7033</p>
              </div>
              
              <div className="bg-blue-50 p-3 rounded text-sm">
                <p className="font-medium">Favor de compartir comprobante de pago con Nombre Completo a los siguientes números:</p>
                <p className="mt-1">WhatsApp: 81 2377 0477 o 81 2040 6850</p>
              </div>
            </div>
            
            {/* Right Column - Terms and Conditions */}
            <div className="border-l border-gray-200 pl-8">
              <p className="font-semibold text-sm mb-3">TÉRMINOS Y CONDICIONES</p>
              <ul className="space-y-2">
                <li>• Precios en pesos mexicanos</li>
                <li>• Vigencia de la cotización: 7 días</li>
                <li>• Los precios no incluyen IVA</li>
              </ul>
            </div>
          </div>
          
          {/* Centered Thank You */}
          <div className="text-center mt-8">
            <p className="text-sm font-medium text-gray-800">¡GRACIAS POR SU PREFERENCIA!</p>
            <p className="text-sm font-medium text-gray-800 mb-1">BS27 GARAGE</p>
            <p className="text-xs text-gray-500">Servicio profesional con garantía</p>
          </div>
        </div>
      </div>
      <style>{`
        @media print {
          @page {
            size: 8.5in 11in; /* 8.5" x 11" */
            margin: 0.5in 0.5in 0.5in 0.5in; /* 0.5" margins */
          }`}
      </style>
      <style>{`
        @media print {
          
          body, html {
            width: 8.5in;
            height: 11in;
            margin: 0;
            padding: 0;
          }
          
          body * {
            visibility: hidden;
          }
          #quote-preview-content, #quote-preview-content * {
            visibility: visible;
          }
          
          #quote-preview-content {
            width: 7.5in; /* 8.5" - 2*0.5" margins */
            min-height: 10in; /* 11" - 2*0.5" margins */
            margin: 0 auto;
            padding: 0;
            box-sizing: border-box;
            font-size: 10pt;
            position: relative;
          }
          
          /* Ensure content breaks properly across pages */
          .break-before {
            page-break-before: always;
          }
          
          .break-after {
            page-break-after: always;
          }
          
          /* Prevent breaking inside important sections */
          .no-break-inside {
            page-break-inside: avoid;
          }
          .no-print {
            display: none !important;
          }
          button {
            display: none !important;
          }
        }`}
      </style>
      <DialogFooter className="p-4 bg-gray-50 border-t no-print">
        <Button variant="outline" onClick={onClose} className="mr-2">Cerrar</Button>
        <Button onClick={handlePrint}>Imprimir / Guardar PDF</Button>
      </DialogFooter>
    </div>
  );

  // If we have onClose, we're in a dialog
  if (onClose) {
    return (
      <Dialog open={!!data} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-4xl p-0" onPointerDownOutside={onClose}>
          {content}
        </DialogContent>
      </Dialog>
    );
  }

  // Otherwise just render the content directly
  return content;
};

// Wrapper component to handle SSR
const QuotePreview: React.FC<QuotePreviewProps> = (props) => {
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null; // or a loading state if you prefer
  }

  return <ClientSideQuotePreview {...props} />;
};

export { QuotePreview };
