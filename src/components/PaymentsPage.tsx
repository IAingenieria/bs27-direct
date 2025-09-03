import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { CreditCard, Plus, CheckCircle, Clock, DollarSign, TrendingUp, TrendingDown, Wallet, Receipt, ArrowRightLeft, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Quote {
  id: string;
  vehiculo: string;
  precio: number;
  status: string;
  clientes: { nombre: string; telefono?: string } | null;
}

interface Income {
  id: string;
  cotizacion_id: string;
  cliente_nombre: string;
  vehiculo: string;
  monto: number;
  precio_total_cotizacion: number;
  metodo_pago: 'efectivo' | 'terminal_pos' | 'transferencia';
  status: 'cobrado' | 'pendiente';
  fecha_pago: string | null;
  notas: string | null;
  created_at: string;
}

interface Expense {
  id: string;
  concepto: string;
  monto: number;
  categoria: string;
  metodo_pago: string;
  fecha: string;
  notas: string | null;
  created_at: string;
}

interface PaymentForm {
  cliente_nombre: string;
  vehiculo: string;
  monto: number;
  metodo_pago: 'efectivo' | 'terminal_pos' | 'transferencia' | 'pendiente';
  descripcion: string;
  notas?: string;
  cotizacion_id?: string;
  cotizacion_numero?: string;
  folio_ingreso?: string;
  vehiculo_marca?: string;
  vehiculo_modelo?: string;
  vehiculo_ano?: string;
}

interface ClientQuote {
  id: string;
  numero_cotizacion: string;
  vehiculo: string;
  precio: number;
  total?: number;
  status: string;
  created_at: string;
}

const PaymentsPage = () => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [clientQuotes, setClientQuotes] = useState<ClientQuote[]>([]);
  const { toast } = useToast();

  const [paymentForm, setPaymentForm] = useState<PaymentForm>({
    cliente_nombre: '',
    vehiculo: '',
    monto: 0,
    metodo_pago: 'efectivo',
    descripcion: '',
    notas: '',
    cotizacion_id: '',
    cotizacion_numero: '',
    folio_ingreso: '',
    vehiculo_marca: '',
    vehiculo_modelo: '',
    vehiculo_ano: ''
  });

  const [newIncome, setNewIncome] = useState({
    cotizacion_id: '',
    metodo_pago: 'efectivo' as 'efectivo' | 'terminal_pos' | 'transferencia',
    status: 'pendiente' as 'cobrado' | 'pendiente',
    notas: '',
    monto_ingreso: '',
    cliente_busqueda: '',
    cotizacion_seleccionada: null as Quote | null
  });

  const [newExpense, setNewExpense] = useState({
    concepto: '',
    monto: '',
    categoria: '',
    metodo_pago: 'efectivo',
    fecha: new Date().toISOString().split('T')[0],
    notas: ''
  });

  const [showNewIncome, setShowNewIncome] = useState(false);
  const [showNewExpense, setShowNewExpense] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [activeTab, setActiveTab] = useState('fecha-inicial');
  const [fechaInicial, setFechaInicial] = useState('');
  const [fechaFinal, setFechaFinal] = useState('');

  useEffect(() => {
    fetchData();
    fetchClients();
  }, []);

  const fetchData = async () => {
    try {
      const { data, error } = await supabase
        .from('pagos')
        .select(`
          *,
          cotizaciones (
            vehiculo,
            precio,
            clientes (nombre, telefono)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mappedIncomes = data?.map(item => ({
        id: item.id,
        cotizacion_id: item.cotizacion_id,
        cliente_nombre: item.cotizaciones?.clientes?.nombre || 'Cliente',
        cliente_telefono: item.cotizaciones?.clientes?.telefono || '',
        vehiculo: item.cotizaciones?.vehiculo || 'Vehículo',
        monto: item.monto_total || 0,
        precio_total_cotizacion: item.cotizaciones?.precio || 0,
        metodo_pago: (item.metodo_pago as 'efectivo' | 'terminal_pos' | 'transferencia') || 'efectivo',
        status: (item.pagado ? 'cobrado' : 'pendiente') as 'cobrado' | 'pendiente',
        fecha_pago: item.updated_at,
        notas: item.notas,
        created_at: item.created_at
      })) || [];

      setIncomes(mappedIncomes);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Error al cargar los datos de pagos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const { data: clientsData, error } = await supabase
        .from('cotizaciones')
        .select('clientes(nombre), vehiculo, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClients(clientsData || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  // Función simplificada - eliminada para evitar errores de TypeScript
  const fetchClientQuotes = async (clientName: string) => {
    setClientQuotes([]);
  };

  // Función simplificada para buscar solo en cotizaciones (tabla que existe)
  const fetchQuoteData = async (quoteNumber: string) => {
    try {
      console.log('🔍 Buscando cotización:', quoteNumber);
      
      // Buscar en cotizaciones con JOIN a clientes
      const { data: cotizacionData, error: cotizacionError } = await supabase
        .from('cotizaciones')
        .select(`
          *,
          clientes (
            nombre,
            telefono,
            email
          )
        `);

      console.log('Todas las cotizaciones:', { data: cotizacionData, error: cotizacionError });

      if (!cotizacionError && cotizacionData && cotizacionData.length > 0) {
        // Buscar coincidencia por ID o número
        const quote = cotizacionData.find(q => 
          q.id.includes(quoteNumber.replace(/[^0-9a-f-]/gi, '')) ||
          quoteNumber.toLowerCase().includes(q.id.toLowerCase())
        );
        
        if (quote) {
          console.log('✅ Cotización encontrada:', quote);
          const vehiculoParts = quote.vehiculo?.split(' ') || [];
          
          setPaymentForm(prev => ({
            ...prev,
            cotizacion_id: String(quote.id),
            cliente_nombre: quote.clientes?.nombre || prev.cliente_nombre,
            vehiculo_marca: vehiculoParts[0] || prev.vehiculo_marca,
            vehiculo_modelo: vehiculoParts.slice(1, -1).join(' ') || prev.vehiculo_modelo,
            vehiculo_ano: vehiculoParts[vehiculoParts.length - 1] || prev.vehiculo_ano,
            monto: quote.precio || prev.monto
          }));
          
          toast({
            title: "Cotización encontrada",
            description: `Datos cargados de: ${quote.clientes?.nombre}`,
          });
          return;
        }
      }

      // Si no se encuentra
      console.log('❌ No se encontró la cotización:', quoteNumber);
      toast({
        title: "Cotización no encontrada",
        description: `No se encontró la cotización ${quoteNumber}`,
        variant: "destructive",
      });

    } catch (error) {
      console.error('❌ Error buscando cotización:', error);
      toast({
        title: "Error",
        description: `Error al buscar la cotización: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const getLastVehicleForClient = (clientName: string) => {
    if (!clientName || !incomes || incomes.length === 0) return '';
    
    const clientVehicles = incomes.filter(
      c => c.cliente_nombre && c.cliente_nombre.toLowerCase().includes(clientName.toLowerCase())
    );
    return clientVehicles.length > 0 ? clientVehicles[0].vehiculo || '' : '';
  };

  const handlePaymentSubmit = async () => {
    try {
      console.log('Submitting payment with form data:', paymentForm);

      // Validación de campos requeridos
      if (!paymentForm.cliente_nombre || !paymentForm.monto || !paymentForm.descripcion) {
        toast({
          title: "Error",
          description: "Por favor complete todos los campos requeridos (Cliente, Monto, Descripción)",
          variant: "destructive",
        });
        return;
      }

      // Preparar datos completos para insertar en la tabla pagos
      const vehiculoCompleto = paymentForm.vehiculo_marca && paymentForm.vehiculo_modelo && paymentForm.vehiculo_ano 
        ? `${paymentForm.vehiculo_marca} ${paymentForm.vehiculo_modelo} ${paymentForm.vehiculo_ano}`
        : paymentForm.vehiculo || 'No especificado';

      // Use ingresos table instead of pagos to avoid cotizacion_id constraint
      const paymentData = {
        cotizacion_id: paymentForm.cotizacion_id || null,
        cliente_nombre: paymentForm.cliente_nombre,
        vehiculo: vehiculoCompleto,
        monto: Number(paymentForm.monto),
        metodo_pago: paymentForm.metodo_pago === 'pendiente' ? 'efectivo' : paymentForm.metodo_pago,
        status: paymentForm.metodo_pago === 'pendiente' ? 'pendiente' : 'cobrado',
        fecha_pago: paymentForm.metodo_pago === 'pendiente' ? null : new Date().toISOString(),
        notas: `Folio: ${paymentForm.folio_ingreso || 'Sin folio'} | Cotización: ${paymentForm.cotizacion_numero || 'N/A'} | Concepto: ${paymentForm.descripcion} | Observaciones: ${paymentForm.notas || 'Ninguna'}`
      };

      console.log('Payment data to insert:', paymentData);

      const { data, error } = await supabase
        .from('ingresos')
        .insert([paymentData])
        .select();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Payment inserted successfully:', data);

      toast({
        title: "Éxito",
        description: "Pago registrado correctamente",
      });

      // Resetear formulario
      setShowPaymentDialog(false);
      setPaymentForm({
        cliente_nombre: '',
        vehiculo: '',
        monto: 0,
        metodo_pago: 'efectivo',
        descripcion: '',
        notas: '',
        cotizacion_id: '',
        cotizacion_numero: ''
      });
      setClientQuotes([]);
      
      // Recargar datos
      fetchData();
    } catch (error) {
      console.error('Error creating payment:', error);
      toast({
        title: "Error",
        description: `Error al registrar el pago: ${error.message || 'Error desconocido'}`,
        variant: "destructive",
      });
    }
  };

  const handleQuoteSelection = (quote: ClientQuote) => {
    setPaymentForm({
      ...paymentForm,
      cotizacion_id: quote.id,
      cotizacion_numero: quote.numero_cotizacion,
      vehiculo: quote.vehiculo,
      monto: quote.precio || quote.total
    });
  };

  const createIncome = async () => {
    try {
      if (!newIncome.cotizacion_seleccionada) {
        toast({
          title: "Error",
          description: "Debe seleccionar una cotización",
          variant: "destructive",
        });
        return;
      }

      if (!newIncome.monto_ingreso || parseFloat(newIncome.monto_ingreso) <= 0) {
        toast({
          title: "Error",
          description: "Debe ingresar un monto válido",
          variant: "destructive",
        });
        return;
      }

      console.log('Attempting to insert income:', {
        cotizacion_id: newIncome.cotizacion_id,
        cliente_nombre: newIncome.cotizacion_seleccionada.clientes?.nombre || 'Cliente',
        cliente_telefono: newIncome.cotizacion_seleccionada.clientes?.telefono || null,
        vehiculo: newIncome.cotizacion_seleccionada.vehiculo,
        monto: parseFloat(newIncome.monto_ingreso),
        metodo_pago: newIncome.metodo_pago,
        status: newIncome.status,
        fecha_pago: newIncome.status === 'cobrado' ? new Date().toISOString() : null,
        notas: newIncome.notas || null
      });

      const { data, error } = await supabase
        .from('pagos')
        .insert({
          cotizacion_id: newIncome.cotizacion_id,
          monto_total: parseFloat(newIncome.monto_ingreso),
          metodo_pago: newIncome.metodo_pago,
          notas: newIncome.notas || null
        })
        .select();

      console.log('Insert result:', { data, error });

      if (error) throw error;

      toast({
        title: "Ingreso registrado",
        description: "El ingreso ha sido registrado exitosamente",
      });

      setNewIncome({
        cotizacion_id: '',
        metodo_pago: 'efectivo',
        status: 'pendiente',
        notas: '',
        monto_ingreso: '',
        cliente_busqueda: '',
        cotizacion_seleccionada: null
      });
      setShowNewIncome(false);
      fetchData();
    } catch (error) {
      console.error('Error creating income:', error);
      toast({
        title: "Error",
        description: `No se pudo registrar el ingreso: ${error.message || 'Error desconocido'}`,
        variant: "destructive",
      });
    }
  };

  const updateIncomeStatus = async (incomeId: string, status: 'cobrado' | 'pendiente') => {
    try {
      const { error } = await supabase
        .from('pagos')
        .update({
          pagado: status === 'cobrado'
        })
        .eq('id', incomeId);

      if (error) throw error;

      toast({
        title: "Estado actualizado",
        description: `El ingreso ha sido marcado como ${status}`,
      });

      fetchData();
    } catch (error) {
      console.error('Error updating income:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'cobrado':
        return (
          <Badge className="bg-green-100 text-green-800 border border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Cobrado
          </Badge>
        );
      case 'pendiente':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border border-yellow-200">
            <Clock className="h-3 w-3 mr-1" />
            Pendiente
          </Badge>
        );
      default:
        return null;
    }
  };

  const getPaymentMethodBadge = (method: string) => {
    const colors = {
      efectivo: 'bg-green-100 text-green-800 border-green-200',
      terminal_pos: 'bg-blue-100 text-blue-800 border-blue-200',
      transferencia: 'bg-purple-100 text-purple-800 border-purple-200'
    };

    const labels = {
      efectivo: 'Efectivo',
      terminal_pos: 'Terminal POS',
      transferencia: 'Transferencia'
    };

    return (
      <Badge className={`${colors[method as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200'} border`}>
        {labels[method as keyof typeof labels] || method}
      </Badge>
    );
  };

  const calculateTotals = () => {
    const totalEgresos = expenses.reduce((sum, expense) => sum + expense.monto, 0);
    
    const ingresosEfectivo = incomes
      .filter(income => income.metodo_pago === 'efectivo')
      .reduce((sum, income) => sum + income.monto, 0);
    
    const ingresosTerminal = incomes
      .filter(income => income.metodo_pago === 'terminal_pos')
      .reduce((sum, income) => sum + income.monto, 0);
    
    const ingresosTransferencia = incomes
      .filter(income => income.metodo_pago === 'transferencia')
      .reduce((sum, income) => sum + income.monto, 0);

    // Total Ingresos es la suma de todos los métodos de pago
    const totalIngresos = ingresosEfectivo + ingresosTerminal + ingresosTransferencia;

    return {
      totalIngresos,
      totalEgresos,
      balance: totalIngresos - totalEgresos,
      ingresosEfectivo,
      ingresosTerminal,
      ingresosTransferencia
    };
  };

  const calculatePendingBalance = (cotizacionId: string, totalCotizacion: number) => {
    // Buscar TODOS los pagos de esta cotización (incluir todos los estados)
    const todosPagos = incomes.filter(income => income.cotizacion_id === cotizacionId);
    
    // Sumar TODOS los pagos realizados (cobrados y pendientes)
    const totalPagado = todosPagos.reduce((sum, income) => sum + income.monto, 0);
    const resto = totalCotizacion - totalPagado;
    
    console.log(`Cotización ${cotizacionId}:`, {
      totalCotizacion,
      todosPagos: todosPagos.length,
      totalPagado,
      resto,
      pagos: todosPagos.map(p => ({ monto: p.monto, status: p.status }))
    });
    
    return resto;
  };

  const totals = calculateTotals();

  // Agrupar pagos por cotización y cliente
  const groupedPayments = incomes.reduce((groups: any[], income) => {
    const existingGroup = groups.find(g => g.cotizacionId === income.cotizacion_id);
    
    if (existingGroup) {
      existingGroup.payments.push(income);
      existingGroup.totalPagado += income.monto;
    } else {
      groups.push({
        cotizacionId: income.cotizacion_id,
        clienteNombre: income.cliente_nombre,
        clienteTelefono: income.cliente_telefono,
        vehiculo: income.vehiculo,
        totalCotizacion: income.precio_total_cotizacion,
        totalPagado: income.monto,
        resto: calculatePendingBalance(income.cotizacion_id, income.precio_total_cotizacion),
        payments: [income]
      });
    }
    
    return groups;
  }, []);

  // Recalcular resto para cada grupo
  groupedPayments.forEach(group => {
    group.resto = group.totalCotizacion - group.totalPagado;
  });
  const filteredIncomes = incomes.filter(income => {
    if (filterStatus === 'all') return true;
    return income.status === filterStatus;
  });

  // Agrupar pagos por cliente
  const groupedByClient = filteredIncomes.reduce((groups, income) => {
    const clientKey = `${income.cliente_nombre}-${income.cotizacion_id}`;
    if (!groups[clientKey]) {
      groups[clientKey] = {
        cliente_nombre: income.cliente_nombre,
        vehiculo: income.vehiculo,
        cotizacion_id: income.cotizacion_id,
        precio_total_cotizacion: income.precio_total_cotizacion,
        pagos: []
      };
    }
    groups[clientKey].pagos.push(income);
    return groups;
  }, {} as Record<string, {
    cliente_nombre: string;
    vehiculo: string;
    cotizacion_id: string;
    precio_total_cotizacion: number;
    pagos: Income[];
  }>);

  const clientGroups = Object.values(groupedByClient);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-h-screen overflow-y-auto pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Control de Pagos</h1>
        </div>
        <Button 
          onClick={() => setShowPaymentDialog(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Ingreso de Pago
        </Button>
      </div>

      {/* Resumen Financiero */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Ingresos</p>
                <p className="text-2xl font-bold text-green-600">
                  ${totals.totalIngresos.toLocaleString('es-MX')}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Transferencias</p>
                <p className="text-2xl font-bold text-blue-600">
                  ${totals.ingresosTransferencia.toLocaleString('es-MX')}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {incomes.filter(income => income.metodo_pago === 'transferencia').length} transferencias registradas
                </p>
              </div>
              <ArrowRightLeft className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>


        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Efectivo</p>
                <p className="text-xl font-bold text-green-600">
                  ${totals.ingresosEfectivo.toLocaleString('es-MX')}
                </p>
              </div>
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Terminal/Transf.</p>
                <p className="text-xl font-bold text-blue-600">
                  ${(totals.ingresosTerminal + totals.ingresosTransferencia).toLocaleString('es-MX')}
                </p>
              </div>
              <CreditCard className="h-6 w-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros de Fecha */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="fecha-inicial">FECHA INICIAL</TabsTrigger>
          <TabsTrigger value="fecha-final">FECHA FINAL</TabsTrigger>
        </TabsList>

        {/* Tab de Fecha Inicial */}
        <TabsContent value="fecha-inicial" className="space-y-4">
          <div className="flex justify-center">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle className="text-center">Seleccionar Fecha Inicial</CardTitle>
                <CardDescription className="text-center">
                  Elige la fecha de inicio para el análisis de pagos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="fecha-inicial">Fecha Inicial</Label>
                  <Input
                    id="fecha-inicial"
                    type="date"
                    value={fechaInicial}
                    onChange={(e) => setFechaInicial(e.target.value)}
                    className="w-full"
                  />
                </div>
                {fechaInicial && (
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-700">
                      Fecha seleccionada: {new Date(fechaInicial).toLocaleDateString('es-MX', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab de Fecha Final */}
        <TabsContent value="fecha-final" className="space-y-4">
          <div className="flex justify-center">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle className="text-center">Seleccionar Fecha Final</CardTitle>
                <CardDescription className="text-center">
                  Elige la fecha de fin para el análisis de pagos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="fecha-final">Fecha Final</Label>
                  <Input
                    id="fecha-final"
                    type="date"
                    value={fechaFinal}
                    onChange={(e) => setFechaFinal(e.target.value)}
                    className="w-full"
                    min={fechaInicial}
                  />
                </div>
                {fechaFinal && (
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-700">
                      Fecha seleccionada: {new Date(fechaFinal).toLocaleDateString('es-MX', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                )}
                {fechaInicial && fechaFinal && (
                  <div className="text-center p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <p className="text-sm text-purple-700 font-medium">
                      Rango: {Math.ceil((new Date(fechaFinal).getTime() - new Date(fechaInicial).getTime()) / (1000 * 60 * 60 * 24))} días
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Sección de Pagos Agrupados por Cliente (Vista Original) */}
      {!fechaInicial || !fechaFinal ? (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Pagos por Cliente</CardTitle>
            <CardDescription>
              Vista agrupada de todos los pagos organizados por cliente y cotización
            </CardDescription>
          </CardHeader>
          <CardContent>
            {groupedPayments.map((group) => (
              <Card key={group.cotizacionId} className="mb-6 border-l-4 border-l-blue-500">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{group.vehiculo}</CardTitle>
                      <CardDescription>{group.clienteNombre}</CardDescription>
                      {group.clienteTelefono && (
                        <p className="text-sm text-muted-foreground">{group.clienteTelefono}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-sm text-muted-foreground">Total Pagado</p>
                          <p className="text-lg font-bold text-green-600">
                            ${group.totalPagado.toLocaleString('es-MX')}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">RESTO</p>
                          <p className={`text-lg font-bold ${group.resto <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ${Math.abs(group.resto).toLocaleString('es-MX')}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Número de Pagos</p>
                          <p className="text-lg font-bold text-blue-600">
                            {group.payments.length}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {group.payments.map((payment, index) => (
                      <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium">${payment.monto.toLocaleString('es-MX')}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(payment.created_at).toLocaleDateString('es-MX')}
                            </p>
                            {payment.notas && (
                              <p className="text-xs text-gray-500 mt-1">{payment.notas}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getPaymentMethodBadge(payment.metodo_pago)}
                          {getStatusBadge(payment.status)}
                          {payment.status === 'pendiente' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => markAsPaid(payment.id)}
                              className="text-green-600 border-green-600 hover:bg-green-50"
                            >
                              Marcar Cobrado
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {/* Sección de Operaciones Filtradas */}
      {fechaInicial && fechaFinal && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Operaciones del {new Date(fechaInicial).toLocaleDateString('es-MX')} al {new Date(fechaFinal).toLocaleDateString('es-MX')}
            </CardTitle>
            <CardDescription>
              Mostrando todas las operaciones en el rango de fechas seleccionado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="ingresos-filtrados" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="ingresos-filtrados">Ingresos</TabsTrigger>
                <TabsTrigger value="egresos-filtrados">Egresos</TabsTrigger>
              </TabsList>

              <TabsContent value="ingresos-filtrados" className="space-y-4">
                {(() => {
                  const ingresosFiltrados = incomes.filter(income => {
                    const fechaIngreso = new Date(income.created_at).toISOString().split('T')[0];
                    return fechaIngreso >= fechaInicial && fechaIngreso <= fechaFinal;
                  });

                  if (ingresosFiltrados.length === 0) {
                    return (
                      <div className="text-center py-8 text-muted-foreground">
                        No hay ingresos en el rango de fechas seleccionado
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-4">
                      <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-700">
                          Se encontraron {ingresosFiltrados.length} ingresos en el período seleccionado
                        </p>
                        <p className="text-lg font-bold text-blue-800">
                          Total: ${ingresosFiltrados.reduce((sum, income) => sum + income.monto, 0).toLocaleString('es-MX')}
                        </p>
                      </div>
                      
                      {ingresosFiltrados.map((income, index) => (
                        <Card key={income.id} className="border-l-4 border-l-green-500">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-medium">
                                  {index + 1}
                                </div>
                                <div>
                                  <p className="font-medium">{income.descripcion}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {new Date(income.created_at).toLocaleDateString('es-MX')}
                                  </p>
                                  {income.notas && (
                                    <p className="text-xs text-gray-500 mt-1">{income.notas}</p>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-xl font-bold text-green-600">
                                  ${income.monto.toLocaleString('es-MX')}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  {getPaymentMethodBadge(income.metodo_pago)}
                                  {getStatusBadge(income.status)}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  );
                })()}
              </TabsContent>

              <TabsContent value="egresos-filtrados" className="space-y-4">
                {(() => {
                  const egresosFiltrados = expenses.filter(expense => {
                    const fechaEgreso = new Date(expense.created_at).toISOString().split('T')[0];
                    return fechaEgreso >= fechaInicial && fechaEgreso <= fechaFinal;
                  });

                  if (egresosFiltrados.length === 0) {
                    return (
                      <div className="text-center py-8 text-muted-foreground">
                        No hay egresos en el rango de fechas seleccionado
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-4">
                      {egresosFiltrados.map((expense) => (
                        <Card key={expense.id} className="border-l-4 border-l-red-500">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">{expense.concepto}</p>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(expense.created_at).toLocaleDateString('es-MX')}
                                </p>
                                <Badge variant="outline" className="mt-1">
                                  {expense.categoria}
                                </Badge>
                              </div>
                              <div className="text-right">
                                <p className="text-xl font-bold text-red-600">
                                  ${expense.monto.toLocaleString('es-MX')}
                                </p>
                                {getPaymentMethodBadge(expense.metodo_pago)}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  );
                })()}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Tab de Ingresos (mantener funcionalidad original) */}
      <Tabs defaultValue="ingresos" className="w-full" style={{ display: 'none' }}>
        <TabsContent value="ingresos" className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="cobrado">Cobrados</SelectItem>
                  <SelectItem value="pendiente">Pendientes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => setShowNewIncome(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Ingreso
            </Button>
          </div>

          <div className="space-y-4">
            {clientGroups.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Receipt className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No hay ingresos</h3>
                  <p className="text-muted-foreground">
                    Registra el primer ingreso para comenzar
                  </p>
                </CardContent>
              </Card>
            ) : (
              clientGroups.map((group) => {
                const totalPagado = group.pagos.reduce((sum, pago) => sum + pago.monto, 0);
                const resto = group.precio_total_cotizacion - totalPagado;
                
                return (
                  <Card key={group.cotizacion_id} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-6">
                      {/* Header del Cliente */}
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h3 className="font-semibold text-xl">{group.vehiculo}</h3>
                          <p className="text-muted-foreground text-lg">Cliente: {group.cliente_nombre}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Total Cotización</p>
                          <p className="text-2xl font-bold text-blue-600">
                            ${group.precio_total_cotizacion.toLocaleString('es-MX')}
                          </p>
                        </div>
                      </div>

                      {/* Resumen de Pagos */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Total Pagado</p>
                          <p className="text-xl font-bold text-green-600">
                            ${totalPagado.toLocaleString('es-MX')}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">RESTO</p>
                          <p className={`text-xl font-bold ${resto > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            ${resto.toLocaleString('es-MX')}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Número de Pagos</p>
                          <p className="text-xl font-bold text-gray-700">
                            {group.pagos.length}
                          </p>
                        </div>
                      </div>

                      {/* Lista de Pagos */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-lg mb-3">Historial de Pagos:</h4>
                        {group.pagos.map((pago, index) => (
                          <div key={pago.id} className="flex items-center justify-between p-3 bg-white border rounded-lg">
                            <div className="flex items-center gap-4">
                              <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold">
                                {index + 1}
                              </div>
                              <div>
                                <p className="font-medium">${pago.monto.toLocaleString('es-MX')}</p>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(pago.fecha_pago || pago.created_at).toLocaleDateString('es-MX')}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {getStatusBadge(pago.status)}
                              {getPaymentMethodBadge(pago.metodo_pago)}
                              {pago.status === 'pendiente' && (
                                <Button
                                  size="sm"
                                  onClick={() => updateIncomeStatus(pago.id, 'cobrado')}
                                  className="bg-green-600 hover:bg-green-700 ml-2"
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Cobrar
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Notas si existen */}
                      {group.pagos.some(pago => pago.notas) && (
                        <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                          <p className="text-sm font-medium text-yellow-800 mb-2">Notas:</p>
                          {group.pagos.filter(pago => pago.notas).map(pago => (
                            <p key={pago.id} className="text-sm text-yellow-700">
                              • {pago.notas}
                            </p>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        {/* Tab de Egresos */}
        <TabsContent value="egresos" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowNewExpense(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Egreso
            </Button>
          </div>

          <Card>
            <CardContent className="text-center py-12">
              <TrendingDown className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Función en desarrollo</h3>
              <p className="text-muted-foreground">
                La gestión de egresos estará disponible próximamente
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal Nuevo Ingreso */}
      <Dialog open={showNewIncome} onOpenChange={setShowNewIncome}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Registrar Nuevo Ingreso</DialogTitle>
            <DialogDescription>
              Registra un ingreso basado en una cotización aprobada
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="cliente_busqueda">Buscar Cliente *</Label>
              <Input
                id="cliente_busqueda"
                placeholder="Buscar por nombre o teléfono del cliente..."
                value={newIncome.cliente_busqueda}
                onChange={(e) => setNewIncome({...newIncome, cliente_busqueda: e.target.value})}
              />
            </div>

            {newIncome.cliente_busqueda && (
              <div>
                <Label>Cotizaciones Encontradas</Label>
                <div className="border rounded-lg max-h-40 overflow-y-auto">
                  {quotes
                    .filter(quote => 
                      quote.clientes?.nombre?.toLowerCase().includes(newIncome.cliente_busqueda.toLowerCase()) ||
                      quote.clientes?.telefono?.includes(newIncome.cliente_busqueda)
                    )
                    .map((quote) => (
                      <div 
                        key={quote.id} 
                        className={`p-3 border-b cursor-pointer hover:bg-gray-50 ${
                          newIncome.cotizacion_seleccionada?.id === quote.id ? 'bg-blue-50 border-blue-200' : ''
                        }`}
                        onClick={() => setNewIncome({
                          ...newIncome, 
                          cotizacion_id: quote.id,
                          cotizacion_seleccionada: quote
                        })}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">{quote.clientes?.nombre}</p>
                            <p className="text-sm text-gray-600">{quote.clientes?.telefono}</p>
                            <p className="text-sm text-gray-600">{quote.vehiculo}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-green-600">
                              ${quote.precio.toLocaleString('es-MX')}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  }
                </div>
              </div>
            )}

            {newIncome.cotizacion_seleccionada && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Cotización Seleccionada</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p><strong>Cliente:</strong> {newIncome.cotizacion_seleccionada.clientes?.nombre}</p>
                    <p><strong>Teléfono:</strong> {newIncome.cotizacion_seleccionada.clientes?.telefono}</p>
                    <p><strong>Vehículo:</strong> {newIncome.cotizacion_seleccionada.vehiculo}</p>
                  </div>
                  <div>
                    <p><strong>Total Cotización:</strong></p>
                    <p className="text-2xl font-bold text-green-600">
                      ${newIncome.cotizacion_seleccionada.precio.toLocaleString('es-MX')}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="monto_ingreso">Monto del Ingreso (Pesos) *</Label>
              <Input
                id="monto_ingreso"
                type="number"
                placeholder="0.00"
                value={newIncome.monto_ingreso}
                onChange={(e) => setNewIncome({...newIncome, monto_ingreso: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="metodo_pago">Método de Pago *</Label>
                <Select value={newIncome.metodo_pago} onValueChange={(value: 'efectivo' | 'terminal_pos' | 'transferencia') => setNewIncome({...newIncome, metodo_pago: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="efectivo">EFECTIVO</SelectItem>
                    <SelectItem value="terminal_pos">TERMINAL</SelectItem>
                    <SelectItem value="transferencia">TRANSFERENCIA</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="status">Estado *</Label>
                <Select value={newIncome.status} onValueChange={(value: 'cobrado' | 'pendiente') => setNewIncome({...newIncome, status: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendiente">Pendiente</SelectItem>
                    <SelectItem value="cobrado">Cobrado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="notas">Notas</Label>
              <Textarea
                id="notas"
                value={newIncome.notas}
                onChange={(e) => setNewIncome({...newIncome, notas: e.target.value})}
                placeholder="Información adicional sobre el pago"
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setShowNewIncome(false)}>
                Cancelar
              </Button>
              <Button onClick={createIncome}>
                Registrar Ingreso
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Enhanced Payment Dialog */}
      {showPaymentDialog && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Registro de Pago - Ingreso al Taller</h2>
              
              <div className="space-y-4">
                {/* Folio de Ingreso */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <label className="block text-sm font-medium text-blue-800 mb-2">Folio de Ingreso al Taller</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-blue-300 rounded-md bg-white"
                    placeholder="Ej: BS27-2025-001"
                    value={paymentForm.folio_ingreso || ''}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, folio_ingreso: e.target.value }))}
                  />
                </div>

                {/* Cliente y Cotización */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Cliente</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="Nombre del cliente"
                      value={paymentForm.cliente_nombre}
                      onChange={(e) => setPaymentForm(prev => ({ ...prev, cliente_nombre: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Número de Cotización</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="Ej: BS272025083095b"
                      value={paymentForm.cotizacion_numero}
                      onChange={(e) => {
                        const value = e.target.value;
                        setPaymentForm(prev => ({ ...prev, cotizacion_numero: value }));
                        
                        // Buscar después de 1 segundo de inactividad
                        if (value.trim().length > 5) {
                          setTimeout(() => {
                            if (paymentForm.cotizacion_numero === value) {
                              fetchQuoteData(value.trim());
                            }
                          }, 1000);
                        }
                      }}
                    />
                  </div>
                </div>

                {/* Información del Vehículo */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="text-sm font-medium text-gray-800 mb-3">Información del Vehículo</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Marca</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        placeholder="Nissan"
                        value={paymentForm.vehiculo_marca || ''}
                        onChange={(e) => setPaymentForm(prev => ({ ...prev, vehiculo_marca: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Modelo</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        placeholder="Versa"
                        value={paymentForm.vehiculo_modelo || ''}
                        onChange={(e) => setPaymentForm(prev => ({ ...prev, vehiculo_modelo: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Año</label>
                      <input
                        type="number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        placeholder="2023"
                        value={paymentForm.vehiculo_ano || ''}
                        onChange={(e) => setPaymentForm(prev => ({ ...prev, vehiculo_ano: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                {/* Monto y Método de Pago */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Monto Total ($)</label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="0.00"
                      value={paymentForm.monto || ''}
                      onChange={(e) => setPaymentForm(prev => ({ ...prev, monto: Number(e.target.value) }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Método de Pago</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      value={paymentForm.metodo_pago}
                      onChange={(e) => setPaymentForm(prev => ({ ...prev, metodo_pago: e.target.value as any }))}
                    >
                      <option value="efectivo">Efectivo</option>
                      <option value="transferencia">Transferencia</option>
                      <option value="terminal_pos">TPV/POS</option>
                    </select>
                  </div>
                </div>

                {/* Concepto y Notas */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Concepto del Trabajo</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Descripción del trabajo a realizar"
                    value={paymentForm.descripcion}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, descripcion: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Observaciones</label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Notas adicionales, condiciones especiales, etc."
                    rows={3}
                    value={paymentForm.notas || ''}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, notas: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                  onClick={() => {
                    setShowPaymentDialog(false);
                    setPaymentForm({
                      cliente_nombre: '',
                      vehiculo: '',
                      monto: 0,
                      metodo_pago: 'efectivo',
                      descripcion: '',
                      notas: '',
                      cotizacion_id: '',
                      cotizacion_numero: '',
                      folio_ingreso: '',
                      vehiculo_marca: '',
                      vehiculo_modelo: '',
                      vehiculo_ano: ''
                    });
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  onClick={handlePaymentSubmit}
                >
                  Registrar Ingreso
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentsPage;
