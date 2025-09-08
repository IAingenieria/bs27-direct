import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Plus, Trash2, Clock, Send, Check, X, Edit, FileText, Search, Filter } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from '../hooks/use-debounce';

interface Quote {
  id: string;
  quote_number: string;
  client_name: string;
  client_phone: string;
  client_email: string | null;
  vehicle_info: string;
  services: string;
  subtotal: number;
  iva: number;
  total: number;
  status: 'pendiente' | 'en_proceso' | 'enviada' | 'aceptada' | 'rechazada';
  created_at: string;
  anticipo?: number;
  pago1?: number;
  liquidacion?: number;
}

interface PaymentState {
  [quoteId: string]: {
    anticipo: number;
    pago1: number;
    liquidacion: number;
  };
}

interface Client {
  id: string;
  nombre: string;
  telefono: string;
  email: string;
  tipo_cliente: string;
}

interface QuoteItem {
  id: string;
  description: string;
  price: number;
}

const QuotesPage = () => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [filteredQuotes, setFilteredQuotes] = useState<Quote[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [showNewQuote, setShowNewQuote] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([{ id: 'item-1', description: '', price: 0 }]);
  const [clientSearchTerm, setClientSearchTerm] = useState("");
  const debouncedClientSearchTerm = useDebounce(clientSearchTerm, 500);
  const [payments, setPayments] = useState<PaymentState>({});
  const [newQuote, setNewQuote] = useState({
    cliente_nombre: '',
    cliente_telefono: '',
    cliente_email: '',
    vehiculo_marca: '',
    vehiculo_modelo: '',
    vehiculo_año: '',
    problema: '',
    descripcion_trabajo: '',
    precio: '',
    fecha_vencimiento: '',
    notas: ''
  });
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);
  const { toast } = useToast();

  // Función para calcular el pago pendiente
  const calculatePendingPayment = (quoteId: string, total: number) => {
    const payment = payments[quoteId] || { anticipo: 0, pago1: 0, liquidacion: 0 };
    const paid = (payment.anticipo || 0) + (payment.pago1 || 0) + (payment.liquidacion || 0);
    return Math.max(0, total - paid);
  };

  // Cargar pagos cuando se selecciona una cotización
  useEffect(() => {
    if (selectedQuoteId) {
      const quote = quotes.find(q => q.id === selectedQuoteId);
      if (quote) {
        setPayments(prev => ({
          ...prev,
          [quote.id]: {
            anticipo: quote.anticipo || 0,
            pago1: quote.pago1 || 0,
            liquidacion: quote.liquidacion || 0,
          }
        }));
      }
    }
  }, [selectedQuoteId, quotes]);

  // Función para actualizar el estado de pagos localmente y en la base de datos
  const updatePayment = async (quoteId: string, field: keyof PaymentState, value: number) => {
    const newValue = isNaN(value) ? 0 : value; // Asegurar que siempre sea un número
    
    // Actualizar estado local primero para feedback inmediato
    setPayments(prev => ({
      ...prev,
      [quoteId]: {
        ...(prev[quoteId] || { anticipo: 0, pago1: 0, liquidacion: 0 }),
        [field]: newValue
      }
    }));

    // Actualizar base de datos
    try {
      const { data, error } = await supabase.rpc('actualizar_pago', {
        p_quote_id: quoteId,
        p_field: field,
        p_value: newValue
      });

      if (error) {
        console.error('Error from actualizar_pago:', error);
        throw error;
      }

      if (data && data.error) {
        console.error('Database error:', data.error);
        throw new Error(data.error);
      }
      
      // Forzar una actualización del estado local después de un breve retraso
      setTimeout(async () => {
        const { data: updatedQuote, error: fetchError } = await supabase
          .from('cotizaciones')
          .select('anticipo, pago1, liquidacion')
          .eq('id', quoteId)
          .single();

        if (fetchError) {
          console.error('Error fetching updated quote:', fetchError);
          return;
        }

        if (updatedQuote) {
          setPayments(prev => ({
            ...prev,
            [quoteId]: {
              anticipo: Number(updatedQuote.anticipo) || 0,
              pago1: Number(updatedQuote.pago1) || 0,
              liquidacion: Number(updatedQuote.liquidacion) || 0
            }
          }));
        }
      }, 300);
    } catch (error) {
      console.error('Error al actualizar el pago:', error);
      toast.error('Error al guardar el pago');
    }
  };

  useEffect(() => {
    fetchQuotes();
    fetchClients();
  }, []);

  useEffect(() => {
    if (debouncedClientSearchTerm.length > 2) {
      const clienteEncontrado = clients.find(client => 
        client.nombre.toLowerCase().includes(debouncedClientSearchTerm.toLowerCase())
      );
      
      if (clienteEncontrado) {
        setNewQuote(prev => ({
          ...prev,
          cliente_nombre: clienteEncontrado.nombre,
          cliente_telefono: clienteEncontrado.telefono,
          cliente_email: clienteEncontrado.email || ''
        }));
      }
    }
  }, [debouncedClientSearchTerm, clients]);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredQuotes(quotes);
    } else {
      const filtered = quotes.filter(quote =>
        quote.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quote.client_phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (quote.client_email && quote.client_email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        quote.quote_number.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredQuotes(filtered);
    }
  }, [quotes, searchTerm]);

  // Cargar pagos existentes al inicio
  useEffect(() => {
    const loadPayments = async () => {
      // Cargar todos los pagos, no solo los de cierto estado
      const { data: quotes } = await supabase
        .from('cotizaciones')
        .select('id, anticipo, pago1, liquidacion')
        .not('anticipo', 'is', null);

      if (quotes) {
        const paymentsData = quotes.reduce((acc, quote) => ({
          ...acc,
          [quote.id]: {
            anticipo: Number(quote.anticipo) || 0,
            pago1: Number(quote.pago1) || 0,
            liquidacion: Number(quote.liquidacion) || 0,
          },
        }), {});
        setPayments(paymentsData);
      }
    };

    loadPayments();
  }, []);

  const fetchQuotes = async () => {
    try {
      const { data, error } = await supabase
        .from('cotizaciones')
        .select(`
          *,
          clientes (
            nombre,
            telefono,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mappedQuotes = data.map((q: any) => ({
        id: q.id,
        quote_number: q.id.substring(0, 8),
        client_name: q.clientes?.nombre || 'N/A',
        client_phone: q.clientes?.telefono || 'N/A',
        client_email: q.clientes?.email,
        vehicle_info: q.vehiculo,
        services: q.descripcion_trabajo,
        subtotal: q.precio ? q.precio / 1.16 : 0,
        iva: q.precio ? (q.precio / 1.16) * 0.16 : 0,
        total: q.precio || 0,
        status: q.status || 'generada',
        created_at: q.created_at,
      }));

      setQuotes(mappedQuotes);
    } catch (error) {
      console.error('Error fetching quotes:', error);
      toast({
        title: "Error al cargar cotizaciones",
        description: "No se pudieron obtener los datos.",
        variant: "destructive",
      });
    }
  };

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('nombre');

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const addQuoteItem = () => {
    const newId = `item-${Date.now()}`;
    setQuoteItems([...quoteItems, { id: newId, description: '', price: 0 }]);
  };

  const removeQuoteItem = (id: string) => {
    if (quoteItems.length > 1) {
      setQuoteItems(quoteItems.filter(item => item.id !== id));
    }
  };

  const updateQuoteItem = (id: string, field: keyof QuoteItem, value: string | number) => {
    const updatedItems = quoteItems.map(item => 
      item.id === id ? { ...item, [field]: field === 'price' ? Number(value) || 0 : value } : item
    );
    setQuoteItems(updatedItems);
    console.log('Updated items:', updatedItems);
  };

  const calculateSubtotal = () => {
    return quoteItems.reduce((sum, item) => sum + (item.price || 0), 0);
  };

  const calculateIVA = () => {
    return calculateSubtotal() * 0.16;
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateIVA();
  };

  const generatePDF = async () => {
    try {
      // Validar que hay al menos un servicio con descripción y precio
      const validItems = quoteItems.filter(item => 
        item.description.trim() !== '' && (item.price > 0)
      );
      if (validItems.length === 0) {
        toast({
          title: "Error",
          description: "Debe agregar al menos un servicio con descripción y precio válido",
          variant: "destructive",
        });
        return;
      }

      // Validar campos obligatorios
      if (!newQuote.cliente_nombre || !newQuote.cliente_telefono || 
          !newQuote.vehiculo_marca || !newQuote.vehiculo_modelo || !newQuote.vehiculo_año) {
        toast({
          title: "Error",
          description: "Complete todos los campos obligatorios",
          variant: "destructive",
        });
        return;
      }

      // Generar número de cotización
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const random = Math.floor(Math.random() * 999) + 1;
      const quoteNumber = `BS27${year}${month}${day}${String(random).padStart(3, '0')}`;

      // Crear contenido HTML para la cotización con diseño mejorado y estético
      const quoteHTML = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Cotización ${quoteNumber}</title>
          <style>
            @page { 
              size: 8.5in 11in; 
              margin: 0.5in; 
            }
            * { 
              margin: 0; 
              padding: 0; 
              box-sizing: border-box; 
            }
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              font-size: 12px; 
              line-height: 1.4; 
              color: #2c3e50;
              background: white;
              width: 100%;
              max-width: 7.5in;
              margin: 0 auto;
              padding: 0;
            }
            
            /* Header mejorado */
            .header { 
              background: linear-gradient(135deg, #0066cc 0%, #004499 100%);
              color: white;
              padding: 25px;
              border-radius: 10px 10px 0 0;
              margin-bottom: 25px;
              box-shadow: 0 4px 15px rgba(0,102,204,0.2);
            }
            .header-content {
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .company-info h1 { 
              font-size: 28px; 
              font-weight: 700; 
              margin-bottom: 5px;
              text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
            }
            .company-info .subtitle {
              font-size: 14px;
              opacity: 0.9;
              font-weight: 300;
            }
            .quote-info { 
              text-align: right; 
              background: rgba(255,255,255,0.1);
              padding: 15px;
              border-radius: 8px;
            }
            .quote-info h2 { 
              font-size: 20px; 
              margin-bottom: 8px;
              font-weight: 600;
            }
            .quote-info .date { 
              font-size: 12px; 
              opacity: 0.9;
            }

            /* Sección de cliente y vehículo mejorada */
            .client-vehicle-section { 
              display: grid; 
              grid-template-columns: 1fr 1fr; 
              gap: 25px; 
              margin-bottom: 30px; 
            }
            .info-box { 
              background: #f8fafc;
              border: 2px solid #e2e8f0;
              border-left: 5px solid #0066cc;
              padding: 20px; 
              border-radius: 8px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.05);
            }
            .info-box h3 { 
              font-size: 16px; 
              font-weight: 600; 
              color: #0066cc; 
              margin-bottom: 15px; 
              border-bottom: 2px solid #e2e8f0; 
              padding-bottom: 8px; 
            }
            .info-item { 
              margin-bottom: 10px;
              display: flex;
              align-items: center;
              gap: 8px;
            }
            .info-item strong { 
              color: #2c3e50;
              min-width: 80px;
            }
            .info-item .icon {
              font-size: 16px;
            }

            /* Tabla de servicios mejorada */
            .services-section {
              margin-bottom: 30px;
            }
            .services-title {
              font-size: 18px;
              font-weight: 600;
              color: #2c3e50;
              margin-bottom: 15px;
              padding-bottom: 8px;
              border-bottom: 3px solid #0066cc;
            }
            .services-table { 
              width: 100%; 
              border-collapse: collapse; 
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            }
            .services-table th { 
              background: linear-gradient(135deg, #0066cc 0%, #004499 100%);
              color: white;
              padding: 15px 12px; 
              text-align: left; 
              font-weight: 600; 
              font-size: 12px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .services-table td { 
              padding: 15px 12px; 
              border-bottom: 1px solid #e2e8f0; 
              font-size: 13px;
              background: white;
            }
            .services-table tr:nth-child(even) td {
              background: #f8fafc;
            }
            .services-table tr:hover td {
              background: #e6f3ff;
            }
            .services-table .number { 
              text-align: center; 
              width: 60px;
              font-weight: 600;
              color: #0066cc;
            }
            .services-table .price { 
              text-align: right; 
              font-weight: 600;
              color: #2c3e50;
              font-size: 14px;
            }

            /* Sección de totales y pago mejorada */
            .bottom-section { 
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 30px;
              margin-top: 30px; 
            }
            .payment-info { 
              background: #f8fafc;
              border: 2px solid #e2e8f0;
              border-left: 5px solid #0066cc;
              padding: 20px;
              border-radius: 8px;
            }
            .payment-info h3 { 
              font-size: 16px; 
              font-weight: 600; 
              color: #0066cc; 
              margin-bottom: 15px; 
              border-bottom: 2px solid #e2e8f0; 
              padding-bottom: 8px; 
            }
            .payment-info p { 
              font-size: 12px; 
              margin-bottom: 8px;
              line-height: 1.4;
            }
            .payment-info .highlight { 
              background: linear-gradient(135deg, #e6f3ff 0%, #cce7ff 100%);
              border: 1px solid #0066cc;
              padding: 12px; 
              border-radius: 6px; 
              margin: 15px 0; 
              font-size: 11px;
              font-weight: 500;
            }
            
            .totals-container {
              background: white;
              border: 2px solid #e2e8f0;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            }
            .totals-table { 
              width: 100%; 
              border-collapse: collapse; 
            }
            .totals-table td { 
              padding: 12px 15px; 
              font-size: 14px;
              border-bottom: 1px solid #e2e8f0;
            }
            .total-row { 
              background: #f8fafc;
            }
            .total-row td {
              font-weight: 500;
            }
            .grand-total { 
              background: linear-gradient(135deg, #0066cc 0%, #004499 100%);
              color: white; 
              font-weight: 700;
            }
            .grand-total td { 
              border: none;
              font-size: 16px;
              padding: 15px;
            }
            .price-cell {
              text-align: right;
              font-weight: 600;
            }

            /* Footer mejorado */
            .footer { 
              margin-top: 40px; 
              text-align: center; 
              font-size: 11px; 
              color: #64748b; 
              border-top: 2px solid #e2e8f0; 
              padding-top: 20px; 
            }
            .validity { 
              text-align: center; 
              margin-top: 20px; 
              font-size: 12px; 
              color: #0066cc; 
              font-weight: 600;
              background: #e6f3ff;
              padding: 10px;
              border-radius: 6px;
              border: 1px solid #0066cc;
            }

            /* Mejoras para impresión */
            @media print {
              @page {
                size: 8.5in 11in;
                margin: 0.5in;
              }
              body { 
                font-size: 11px;
                width: 7.5in;
                max-width: 7.5in;
                -webkit-print-color-adjust: exact;
                color-adjust: exact;
                margin: 0;
                padding: 0;
              }
              .header, .grand-total, .services-table th {
                -webkit-print-color-adjust: exact;
                color-adjust: exact;
              }
              .header {
                padding: 20px;
                margin-bottom: 20px;
              }
              .client-vehicle-section {
                gap: 20px;
                margin-bottom: 25px;
              }
              .info-box {
                padding: 15px;
              }
              .services-table th, .services-table td {
                padding: 10px 8px;
                font-size: 10px;
              }
              .bottom-section {
                gap: 25px;
                margin-top: 25px;
              }
              .payment-info {
                padding: 15px;
              }
              .payment-info p {
                font-size: 10px;
              }
              .totals-table td {
                padding: 10px 12px;
                font-size: 12px;
              }
              .grand-total td {
                font-size: 14px;
                padding: 12px;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="header-content">
              <div class="company-info">
                <h1>BS<sup>27</sup> | PREMIUM BODY SHOP</h1>
                <div class="subtitle">Servicio Automotriz Especializado</div>
              </div>
              <div class="quote-info">
                <h2>Cotización: ${quoteNumber}</h2>
                <div class="date">Fecha: ${now.toLocaleDateString('es-MX')}</div>
              </div>
            </div>
          </div>

          <div class="client-vehicle-section">
            <div class="info-box">
              <h3>Información del Cliente</h3>
              <div class="info-item">
                <strong>Nombre:</strong> ${newQuote.cliente_nombre}
              </div>
              <div class="info-item">
                <strong>WhatsApp:</strong> ${newQuote.cliente_telefono}
              </div>
              ${newQuote.cliente_email ? `
                <div class="info-item">
                  <strong>Email:</strong> ${newQuote.cliente_email}
                </div>
              ` : ''}
            </div>
            <div class="info-box">
              <h3>Información del Vehículo</h3>
              <div class="info-item">
                <strong>Marca:</strong> ${newQuote.vehiculo_marca}
              </div>
              <div class="info-item">
                <strong>Modelo:</strong> ${newQuote.vehiculo_modelo}
              </div>
              <div class="info-item">
                <strong>Año:</strong> ${newQuote.vehiculo_año}
              </div>
            </div>
          </div>

          <div class="services-section">
            <h2 class="services-title">Servicios Solicitados</h2>
            <table class="services-table">
              <thead>
                <tr>
                  <th class="number">NO</th>
                  <th>DESCRIPCIÓN DEL SERVICIO</th>
                  <th class="price">PRECIO UNITARIO</th>
                </tr>
              </thead>
              <tbody>
                ${validItems.map((item, index) => `
                  <tr>
                    <td class="number">${index + 1}</td>
                    <td>${item.description}</td>
                    <td class="price">$ ${item.price.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div class="bottom-section">
            <div class="payment-info">
              <h3>Métodos de Pago</h3>
              <p><strong>Efectivo</strong></p>
              <p><strong>Tarjetas Bancarias</strong></p>
              
              <p style="margin-top: 15px;"><strong>INFORMACIÓN PARA TRANSFERENCIAS:</strong></p>
              <p><strong>Beneficiario:</strong> EDUARDO AYALA CASTILLEJA</p>
              <p><strong>Banco:</strong> BBVA</p>
              <p><strong>CLABE:</strong> 0125 8000 4845 5359 43</p>
              <p><strong>Tarjeta:</strong> 4152 3141 5148 7033</p>
              
              <div class="highlight">
                <strong>Enviar comprobante de pago con nombre completo a:</strong><br>
                WhatsApp: 81 2377 0477 o 81 2040 6850
              </div>
            </div>

            <div class="totals-container">
              <table class="totals-table">
                <tr class="total-row">
                  <td><strong>SUBTOTAL:</strong></td>
                  <td class="price-cell"><strong>$ ${calculateSubtotal().toLocaleString('es-MX', { minimumFractionDigits: 2 })}</strong></td>
                </tr>
                <tr class="total-row">
                  <td><strong>IVA (16%):</strong></td>
                  <td class="price-cell"><strong>$ ${calculateIVA().toLocaleString('es-MX', { minimumFractionDigits: 2 })}</strong></td>
                </tr>
                <tr class="grand-total">
                  <td><strong>GRAN TOTAL:</strong></td>
                  <td class="price-cell"><strong>$ ${calculateTotal().toLocaleString('es-MX', { minimumFractionDigits: 2 })}</strong></td>
                </tr>
              </table>
            </div>
          </div>

          <div class="validity">
            Esta cotización tiene validez de 30 días a partir de la fecha de emisión
          </div>

          <div class="footer">
            <p><strong>BS27 Premium Body Shop</strong> | Cotización generada el ${now.toLocaleDateString('es-MX')}</p>
            <p>Servicio profesional y garantizado | Monterrey, Nuevo León</p>
          </div>
        </body>
        </html>
      `;

      // Crear y descargar archivo HTML en lugar de abrir ventana
      const blob = new Blob([quoteHTML], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `BS27_Cotizacion_${quoteNumber}.html`;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // 1. Find or create the client to get the ID
      let clienteId;
      try {
        const { data: existingClient } = await supabase
          .from('clientes')
          .select('id')
          .eq('telefono', newQuote.cliente_telefono)
          .single();

        if (existingClient) {
          clienteId = existingClient.id;
        } else {
          const { data: newClient, error: clientError } = await supabase
            .from('clientes')
            .insert({
              nombre: newQuote.cliente_nombre,
              telefono: newQuote.cliente_telefono,
              email: newQuote.cliente_email,
              tipo_cliente: 'individual',
            })
            .select('id')
            .single();

          if (clientError) throw clientError;
          clienteId = newClient.id;
        }

        // 2. Save the quote with the client_id
        const vehiculoString = `${newQuote.vehiculo_marca} ${newQuote.vehiculo_modelo} ${newQuote.vehiculo_año}`;
        const serviciosString = validItems.map(item => item.description).join(', ');

        const { data, error } = await supabase
          .from('cotizaciones')
          .insert({
            cliente_id: clienteId,
            quote_number: quoteNumber,
            vehiculo: vehiculoString,
            problema: newQuote.problema || 'Sin descripción del problema',
            descripcion_trabajo: serviciosString,
            precio: calculateTotal(),
            status: 'pendiente',
            tipo_cliente: 'individual',
            quote_html: quoteHTML,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select();

        if (error) throw error;

        console.log('✅ Quote saved successfully:', data);
        toast({
          title: "Cotización Guardada",
          description: `La cotización ${quoteNumber} se guardó correctamente.`,
        });

      } catch (dbError: any) {
        console.error('❌ Error saving quote or client:', dbError);
        toast({
          title: "Error al Guardar",
          description: `No se pudo guardar la cotización en la base de datos: ${dbError.message}`,
          variant: "destructive",
        });
        return; // Stop execution if saving fails
      }

      toast({
        title: "Cotización generada",
        description: `Cotización ${quoteNumber} creada exitosamente`,
      });

      // Refrescar lista de cotizaciones
      await fetchQuotes();

      // Limpiar formulario pero mantener modal abierto
      setNewQuote({
        cliente_nombre: '',
        cliente_telefono: '',
        cliente_email: '',
        vehiculo_marca: '',
        vehiculo_modelo: '',
        vehiculo_año: '',
        problema: '',
        descripcion_trabajo: '',
        precio: '',
        fecha_vencimiento: '',
        notas: ''
      });
      setQuoteItems([{ id: '1', description: '', price: 0 }]);
      
      // Mostrar mensaje de éxito pero mantener modal abierto
      toast({
        title: "¡Cotización descargada!",
        description: `Archivo BS27_Cotizacion_${quoteNumber}.html descargado. Ábrelo para imprimir la cotización.`,
      });

      // NO cerrar el modal - mantenerlo abierto para crear más cotizaciones
      // setShowNewQuote(false); // Esta línea está comentada intencionalmente

    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "No se pudo generar la cotización",
        variant: "destructive",
      });
    }
  };

  const reprintQuote = (quote: Quote) => {
    // Regenerar el HTML de la cotización
    const now = new Date();
    const quoteHTML = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Cotización ${quote.quote_number}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: Arial, sans-serif; 
            margin: 20px; 
            background: white;
            color: black;
            line-height: 1.4;
          }
          .header { 
            text-align: center; 
            border-bottom: 2px solid #333; 
            padding-bottom: 15px; 
            margin-bottom: 20px;
          }
          .header h1 { 
            font-size: 24px; 
            margin-bottom: 10px; 
            color: #333;
          }
          .client-info, .vehicle-info { 
            background: #f8f9fa; 
            padding: 15px; 
            margin: 15px 0; 
            border: 1px solid #ddd;
            border-radius: 5px;
          }
          .services-table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 20px 0; 
          }
          .services-table th, .services-table td { 
            border: 1px solid #333; 
            padding: 12px; 
            text-align: left; 
          }
          .services-table th { 
            background-color: #4472C4; 
            color: white; 
            font-weight: bold;
          }
          .totals { 
            text-align: right; 
            margin: 20px 0; 
            font-size: 16px;
          }
          .totals p { 
            margin: 8px 0; 
          }
          .gran-total {
            background: #b3d9ff; 
            padding: 15px; 
            display: inline-block;
            border-radius: 5px;
            font-size: 18px;
          }
          .payment-info { 
            background: #e3f2fd; 
            padding: 20px; 
            margin: 20px 0; 
            border-radius: 5px;
            border: 1px solid #2196f3;
          }
          .payment-highlight {
            background: #bbdefb; 
            padding: 15px; 
            margin: 15px 0;
            border-radius: 5px;
            border-left: 4px solid #2196f3;
          }
          .footer { 
            text-align: center; 
            margin-top: 40px; 
            font-size: 12px; 
            color: #666; 
            border-top: 1px solid #ddd;
            padding-top: 20px;
          }
          @media print {
            body { margin: 0; }
            .header { page-break-after: avoid; }
            .payment-info { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>BS²⁷ | PREMIUM BODY SHOP</h1>
          <p><strong>Cotización: ${quote.quote_number}</strong></p>
          <p>Fecha: ${now.toLocaleDateString('es-MX')}</p>
        </div>

        <div class="client-info">
          <h3>Cliente: ${quote.client_name}</h3>
          <p>📱 WhatsApp: ${quote.client_phone}</p>
          ${quote.client_email ? `<p>📧 Email: ${quote.client_email}</p>` : ''}
        </div>

        <div class="vehicle-info">
          <h3>Vehículo: ${quote.vehicle_info}</h3>
        </div>

        <table class="services-table">
          <thead>
            <tr>
              <th style="width: 10%;">NO</th>
              <th style="width: 60%;">DESCRIPCIÓN</th>
              <th style="width: 30%;">PRECIO UNITARIO</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>1-</strong></td>
              <td>${quote.services}</td>
              <td><strong>$ ${quote.subtotal?.toLocaleString('es-MX')}</strong></td>
            </tr>
          </tbody>
        </table>

        <div class="totals">
          <p><strong>TOTAL: $ ${quote.subtotal?.toLocaleString('es-MX')}</strong></p>
          <p><strong>IVA (16%): $ ${quote.iva?.toLocaleString('es-MX')}</strong></p>
          <div class="gran-total">
            <strong>GRAN TOTAL: $ ${quote.total?.toLocaleString('es-MX')}</strong>
          </div>
        </div>

        <div class="payment-info">
          <h3>📋 INFORMACIÓN DE PAGO</h3>
          <p><strong>Nombre del Beneficiario:</strong><br>EDUARDO AYALA CASTILLEJA</p>
          <p><strong>Banco:</strong> BBVA</p>
          <p><strong>CLABE INTERBANCARIA:</strong><br>0125 8000 4845 5359 43</p>
          <p><strong>Tarjeta:</strong><br>4152 3141 5148 7033</p>
          <div class="payment-highlight">
            <p><strong>📱 Favor de compartir comprobante de pago con Nombre Completo a los WhatsApp:</strong></p>
            <p><strong>61 2377 0477</strong> o al <strong>81 2040 6850</strong></p>
          </div>
        </div>

        <div class="footer">
          <p><strong>BS27 Premium Body Shop</strong> - Cotización generada el ${now.toLocaleDateString('es-MX')}</p>
          <p>Esta cotización tiene validez de 30 días a partir de la fecha de emisión</p>
        </div>

        <script>
          // Auto-imprimir después de cargar
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 1000);
          };
        </script>
      </body>
      </html>
    `;

    // Crear y descargar archivo HTML
    const blob = new Blob([quoteHTML], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `BS27_Cotizacion_${quote.quote_number}_Reimpresion.html`;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Cotización descargada",
      description: `Archivo HTML de cotización ${quote.quote_number} descargado. Ábrelo para imprimir.`,
    });
  };

  const deleteQuote = async (quoteId: string) => {
    try {
      console.log(`Deleting quote ${quoteId}...`);
      
      const { error } = await supabase
        .from('cotizaciones')
        .delete()
        .eq('id', quoteId);

      if (error) {
        console.error('❌ Error deleting quote:', error);
        toast({
          title: "Error",
          description: "No se pudo eliminar la cotización",
          variant: "destructive",
        });
        return;
      }

      // Remove from local state immediately
      setQuotes(prevQuotes => prevQuotes.filter(quote => quote.id !== quoteId));
      
      console.log('✅ Quote deleted successfully');
      toast({
        title: "Éxito",
        description: "Cotización eliminada del listado",
      });

    } catch (error) {
      console.error('❌ Error in deleteQuote:', error);
      toast({
        title: "Error",
        description: "Error inesperado al eliminar la cotización",
        variant: "destructive",
      });
    }
  };

  const updateQuoteStatus = async (quoteId: string, newStatus: 'pendiente' | 'en_proceso' | 'enviada' | 'aceptada' | 'rechazada') => {
    console.group(`Updating Quote ${quoteId}`);
    console.log('New status:', newStatus);
    
    try {
      // 1. First, verify the quote exists and get current data
      console.log('Step 1: Fetching current quote data...');
      const { data: currentQuote, error: fetchError } = await supabase
        .from('cotizaciones')
        .select('*')
        .eq('id', quoteId)
        .single();

      if (fetchError) {
        console.error('❌ Error fetching quote:', fetchError);
        throw new Error(`No se pudo obtener la cotización: ${fetchError.message}`);
      }

      if (!currentQuote) {
        console.error('❌ Quote not found in database');
        throw new Error('Cotización no encontrada en la base de datos');
      }

      console.log('Current quote data:', currentQuote);

      // 2. Prepare update data
      const updateData: any = { 
        status: newStatus,
        updated_at: new Date().toISOString()
      };
      
      // 3. Handle payment data if status is 'aceptada'
      if (newStatus === 'aceptada') {
        console.log('Processing payment data for accepted quote...');
        updateData.anticipo = payments[quoteId]?.anticipo ?? 0;
        updateData.pago1 = payments[quoteId]?.pago1 ?? 0;
        updateData.liquidacion = payments[quoteId]?.liquidacion ?? 0;
        
        if (!updateData.anticipo && updateData.anticipo !== 0) {
          console.warn('⚠️ No se especificó anticipo para cotización aceptada');
        }
      }
      
      console.log('Prepared update data:', updateData);
      
      // 4. Execute the update
      console.log('Step 2: Executing database update...');
      const { data: updatedQuote, error: updateError } = await supabase
        .from('cotizaciones')
        .update(updateData)
        .eq('id', quoteId)
        .select('*')
        .single();

      if (updateError) {
        console.error('❌ Database update failed:', updateError);
        
        // Try to get more detailed error info
        const { data: errorData } = await supabase.rpc('get_error_info').single();
        console.error('Detailed error info:', errorData);
        
        throw new Error(`Error al actualizar la cotización: ${updateError.message}`);
      }
      
      console.log('✅ Database update successful:', updatedQuote);

      // Update local state immediately for instant visual feedback
      console.log('Updating local state with new status...');
      setQuotes(prevQuotes => 
        prevQuotes.map(quote => 
          quote.id === quoteId 
            ? { ...quote, status: newStatus }
            : quote
        )
      );

      // Refresh quotes after a short delay to ensure DB is updated
      console.log('Refreshing quotes from database...');
      setTimeout(async () => {
        try {
          await fetchQuotes();
          console.log('✅ Quotes refreshed successfully');
        } catch (refreshError) {
          console.error('❌ Error refreshing quotes:', refreshError);
        }
      }, 300);
      
      console.log(`✅ Successfully updated quote ${quoteId} to status: ${newStatus}`);
      toast({
        title: "✅ Estado actualizado",
        description: `Cotización marcada como ${newStatus.toUpperCase()}`,
      });
    } catch (error) {
      console.error('❌ Error in updateQuoteStatus:', error);
      
      // Log additional error details if available
      if (error instanceof Error) {
        console.error('Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
      }
      
      // Show detailed error message to user
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'No se pudo actualizar el estado de la cotización';
        
      toast({
        title: "❌ Error",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  const getStatusBadge = (status: string, quoteId: string, quote?: any) => {
    const variants = {
      pendiente: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
      enviada: 'bg-purple-100 text-purple-800 border border-purple-200',
      aceptada: 'bg-green-100 text-green-800 border border-green-200',
      rechazada: 'bg-red-100 text-red-800 border border-red-200',
      en_proceso: 'bg-blue-100 text-blue-800 border border-blue-200'
    };

    const icons = {
      pendiente: <Clock className="h-3 w-3 mr-1" />,
      enviada: <Send className="h-3 w-3 mr-1" />,
      aceptada: <Check className="h-3 w-3 mr-1" />,
      rechazada: <X className="h-3 w-3 mr-1" />,
      en_proceso: <Edit className="h-3 w-3 mr-1" />
    };

    // Definir el ciclo de estados (usando solo estados válidos del ENUM)
    const statusCycle = {
      'en_proceso': 'aceptada',
      'aceptada': 'rechazada', 
      'rechazada': 'enviada',
      'enviada': 'en_proceso',
      'pendiente': 'en_proceso'
    };

    const handleStatusClick = () => {
      // Si el estado actual es 'rechazada' (COTIZAR), abrir modal con datos prellenados
      if (status === 'rechazada' && quote) {
        // Extraer datos del vehículo (formato: "Marca Modelo Año")
        const vehicleParts = quote.vehicle_info?.split(' ') || [];
        const marca = vehicleParts[0] || '';
        const modelo = vehicleParts.slice(1, -1).join(' ') || '';
        const año = vehicleParts[vehicleParts.length - 1] || '';
        
        // Prellenar el formulario
        setNewQuote({
          cliente_nombre: quote.client_name || '',
          cliente_telefono: quote.client_phone || '',
          cliente_email: quote.client_email || '',
          vehiculo_marca: marca,
          vehiculo_modelo: modelo,
          vehiculo_año: año,
          problema: quote.services || '',
          descripcion_trabajo: '',
          precio: '',
          fecha_vencimiento: '',
          notas: `Cotización derivada de: ${quote.quote_number}`
        });
        
        // Abrir el modal
        setIsModalOpen(true);
        return;
      }
      
      // Comportamiento normal de cambio de estado
      const nextStatus = statusCycle[status as keyof typeof statusCycle] || 'en_proceso';
      updateQuoteStatus(quoteId, nextStatus as 'pendiente' | 'en_proceso' | 'enviada' | 'aceptada' | 'rechazada');
    };

    return (
      <Badge 
        className={`${variants[status as keyof typeof variants] || variants.pendiente} cursor-pointer hover:opacity-80 transition-opacity`}
        onClick={handleStatusClick}
        title={status === 'rechazada' ? 'Click para crear nueva cotización' : `Click para cambiar a ${statusCycle[status as keyof typeof statusCycle] === 'rechazada' ? 'COTIZAR' : statusCycle[status as keyof typeof statusCycle] === 'enviada' ? 'PERDIDO' : statusCycle[status as keyof typeof statusCycle]?.toUpperCase() || 'EN_PROCESO'}`}
      >
        {icons[status as keyof typeof icons]}
        {status === 'rechazada' ? 'COTIZAR' : status === 'enviada' ? 'PERDIDO' : status.toUpperCase()}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header con botón Nueva Cotización */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Cotizaciones</h1>
          <p className="text-muted-foreground">Gestiona todas las cotizaciones del taller</p>
        </div>
        
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <Button 
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nueva Cotización
          </Button>
          
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Crear Nueva Cotización</DialogTitle>
              <DialogDescription>
                Complete la información para generar una cotización profesional
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Información del Cliente */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground border-b pb-2">Cliente</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cliente_nombre">Nombre del Cliente *</Label>
                    <Input
                      id="cliente_nombre"
                      value={newQuote.cliente_nombre}
                      onChange={(e) => {
                        const nombre = e.target.value;
                        setNewQuote({...newQuote, cliente_nombre: nombre});
                        setClientSearchTerm(nombre);
                      }}
                      placeholder="Nombre completo"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cliente_telefono">WhatsApp/Teléfono *</Label>
                    <Input
                      id="cliente_telefono"
                      value={newQuote.cliente_telefono}
                      onChange={(e) => setNewQuote({...newQuote, cliente_telefono: e.target.value})}
                      placeholder="Número de WhatsApp"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="cliente_email">Email (Opcional)</Label>
                    <Input
                      id="cliente_email"
                      type="email"
                      value={newQuote.cliente_email}
                      onChange={(e) => setNewQuote({...newQuote, cliente_email: e.target.value})}
                      placeholder="correo@ejemplo.com"
                    />
                  </div>
                </div>
              </div>

              {/* Información del Vehículo */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground border-b pb-2">Vehículo</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="vehiculo_marca">Marca *</Label>
                    <Input
                      id="vehiculo_marca"
                      value={newQuote.vehiculo_marca}
                      onChange={(e) => setNewQuote({...newQuote, vehiculo_marca: e.target.value})}
                      placeholder="Toyota, Honda, etc."
                    />
                  </div>
                  <div>
                    <Label htmlFor="vehiculo_modelo">Modelo *</Label>
                    <Input
                      id="vehiculo_modelo"
                      value={newQuote.vehiculo_modelo}
                      onChange={(e) => setNewQuote({...newQuote, vehiculo_modelo: e.target.value})}
                      placeholder="Corolla, Civic, etc."
                    />
                  </div>
                  <div>
                    <Label htmlFor="vehiculo_año">Año *</Label>
                    <Input
                      id="vehiculo_año"
                      value={newQuote.vehiculo_año}
                      onChange={(e) => setNewQuote({...newQuote, vehiculo_año: e.target.value})}
                      placeholder="2020"
                    />
                  </div>
                </div>
              </div>

              {/* Tabla de Servicios */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Servicios y Precios</h3>
                </div>
                
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-blue-50">
                      <tr>
                        <th className="text-left p-3 font-semibold">NO</th>
                        <th className="text-left p-3 font-semibold">DESCRIPCIÓN DEL SERVICIO</th>
                        <th className="text-right p-3 font-semibold">PRECIO UNITARIO</th>
                        <th className="text-center p-3 font-semibold"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {quoteItems.map((item, index) => (
                        <tr key={item.id} className="border-t">
                          <td className="p-3 font-semibold">{index + 1}-</td>
                          <td className="p-3">
                            <Input
                              value={item.description}
                              onChange={(e) => updateQuoteItem(item.id, 'description', e.target.value)}
                              placeholder="Descripción del servicio"
                              className="w-full"
                            />
                          </td>
                          <td className="p-3">
                            <Input
                              type="number"
                              value={item.price || ''}
                              onChange={(e) => {
                                const value = e.target.value;
                                updateQuoteItem(item.id, 'price', value === '' ? 0 : parseFloat(value) || 0);
                              }}
                              placeholder="0.00"
                              className="w-full text-right"
                              min="0"
                              step="0.01"
                            />
                          </td>
                          <td className="p-3 text-center">
                            {quoteItems.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeQuoteItem(item.id)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Botón Agregar Servicio debajo de la tabla */}
                <div className="flex justify-start mt-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addQuoteItem}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Agregar Servicio
                  </Button>
                </div>
              </div>

              {/* Totales */}
              <div className="flex justify-end">
                <div className="w-80 space-y-2">
                                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
                    <span className="font-semibold">SUBTOTAL:</span>
                    <span className="font-bold">{`$ ${calculateSubtotal().toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
                    <span className="font-semibold">IVA (16%):</span>
                    <span className="font-bold">{`$ ${calculateIVA().toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-blue-600 text-white rounded">
                    <span className="font-bold text-lg">GRAN TOTAL:</span>
                    <span className="font-bold text-xl">{`$ ${calculateTotal().toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}</span>
                  </div>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setShowNewQuote(false)}
                >
                  Cancelar
                </Button>
                <Button
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={generatePDF}
                >
                  Generar Cotización
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Barra de búsqueda */}
      <Card className="p-4">
        <div className="flex items-center space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar por nombre, teléfono, correo o número de cotización..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {filteredQuotes.length} de {quotes.length} cotizaciones
            </span>
          </div>
        </div>
      </Card>

      {/* Lista de Cotizaciones */}
      <Card>
        <CardHeader>
          <CardTitle>Cotizaciones Registradas</CardTitle>
          <CardDescription>
            Historial de todas las cotizaciones del sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredQuotes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              {quotes.length === 0 ? (
                <>
                  <p>No hay cotizaciones registradas</p>
                  <p className="text-sm">Crea tu primera cotización usando el botón de arriba</p>
                </>
              ) : (
                <>
                  <p>No se encontraron cotizaciones</p>
                  <p className="text-sm">Intenta con otros términos de búsqueda</p>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredQuotes.map((quote) => (
                <Card key={quote.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">{quote.quote_number}</h3>
                        <p className="text-muted-foreground">{quote.client_name} - {quote.client_phone}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(quote.status, quote.id, quote)}
                        <span className="text-2xl font-bold text-primary">
                          ${quote.total?.toLocaleString('es-MX')}
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <h4 className="font-medium mb-2">Vehículo</h4>
                        <p className="text-sm text-muted-foreground">{quote.vehicle_info}</p>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Servicios</h4>
                        <p className="text-sm text-muted-foreground">{quote.services}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        Creada: {new Date(quote.created_at).toLocaleDateString('es-MX')}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Subtotal: ${quote.subtotal?.toLocaleString('es-MX')} | IVA: ${quote.iva?.toLocaleString('es-MX')}
                      </div>
                    </div>

                    {/* Sistema de Pagos para Cotizaciones ACEPTADAS */}
                    {quote.status === 'aceptada' && (
                      <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <h4 className="font-semibold text-green-800 mb-3">Control de Pagos</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                          <div>
                            <Label htmlFor={`anticipo-${quote.id}`} className="text-sm font-medium text-green-700">
                              ANTICIPO
                            </Label>
                            <Input
                              id={`anticipo-${quote.id}`}
                              type="number"
                              placeholder="0"
                              value={payments[quote.id]?.anticipo || ''}
                              onChange={(e) => updatePayment(quote.id, 'anticipo', parseFloat(e.target.value) || 0)}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`pago1-${quote.id}`} className="text-sm font-medium text-green-700">
                              PAGO 1
                            </Label>
                            <Input
                              id={`pago1-${quote.id}`}
                              type="number"
                              placeholder="0"
                              value={payments[quote.id]?.pago1 || ''}
                              onChange={(e) => updatePayment(quote.id, 'pago1', parseFloat(e.target.value) || 0)}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`liquidacion-${quote.id}`} className="text-sm font-medium text-green-700">
                              LIQUIDACIÓN
                            </Label>
                            <Input
                              id={`liquidacion-${quote.id}`}
                              type="number"
                              placeholder="0"
                              value={payments[quote.id]?.liquidacion || ''}
                              onChange={(e) => updatePayment(quote.id, 'liquidacion', parseFloat(e.target.value) || 0)}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-red-700">
                              PEND PAGO
                            </Label>
                            <div className="mt-1 p-2 bg-red-100 border border-red-300 rounded text-center font-bold text-red-800">
                              ${calculatePendingPayment(quote.id, quote.total || 0).toLocaleString('es-MX')}
                            </div>
                          </div>
                        </div>
                        <div className="text-xs text-green-600">
                          Total: ${quote.total?.toLocaleString('es-MX')} | 
                          Pagado: ${((payments[quote.id]?.anticipo || 0) + (payments[quote.id]?.pago1 || 0) + (payments[quote.id]?.liquidacion || 0)).toLocaleString('es-MX')}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-2 mt-4 pt-4 border-t">
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                        onClick={() => reprintQuote(quote)}
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        REIMPRIMIR
                      </Button>
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                          onClick={() => updateQuoteStatus(quote.id, 'aceptada')}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          ACEPTADA
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                          onClick={() => updateQuoteStatus(quote.id, 'en_proceso')}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          EN PROCESO
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                          onClick={() => updateQuoteStatus(quote.id, 'rechazada')}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          COTIZAR
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100"
                          onClick={() => deleteQuote(quote.id)}
                        >
                          <X className="h-4 w-4 mr-1" />
                          PERDIDO
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default QuotesPage;
