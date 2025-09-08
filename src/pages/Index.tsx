import { useState, useCallback } from "react";
import { DashboardStats } from "@/components/DashboardStats";
import { QuickActions } from "@/components/QuickActions";
import { VehicleStatus } from "@/components/VehicleStatus";
import { RecentActivity } from "@/components/RecentActivity";
import NotificationsPage from "@/components/NotificationsPage";
import QuotesPage from "@/components/QuotesPage";
import ClientsPage from "@/components/ClientsPage";
import CustomersPage from "@/components/CustomersPage";
import VehiclesPage from "@/components/VehiclesPage";
import PaymentsPage from "@/components/PaymentsPage";
import CalendarPage from "@/components/CalendarPage";
import MainLayout from "@/components/MainLayout";
import ErrorBoundary from "@/components/ErrorBoundary";
import SimpleClientSearch from "@/components/SimpleClientSearch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2 } from "lucide-react";
import ReactDOMServer from 'react-dom/server';
import { QuotePreview } from "@/components/QuotePreview";

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [showNewQuoteModal, setShowNewQuoteModal] = useState(false);
  const [showNewVehicleModal, setShowNewVehicleModal] = useState(false);
  const [showQuotePreviewModal, setShowQuotePreviewModal] = useState(false);
  const [quotePreviewData, setQuotePreviewData] = useState<any>(null);
  const [newClient, setNewClient] = useState({
    nombre: '',
    telefono: '',
    email: '',
    tipo_cliente: '' as 'individual' | 'flotilla' | 'revendedor' | '',
    notas: ''
  });
  
  const [quoteItems, setQuoteItems] = useState([
    { id: '1', description: '', price: 0 }
  ]);
  
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

  const [newVehicle, setNewVehicle] = useState({
    folio: '',
    cliente_id: '',
    cliente_nombre: '',
    marca: '',
    modelo: '',
    año: '',
    placas: '',
    color: '',
    problema_reportado: '',
    notas_ingreso: ''
  });

  // Estados para búsqueda de clientes en Nueva Orden de Taller
  const [clientSearchResults, setClientSearchResults] = useState<any[]>([]);
  const [showClientResults, setShowClientResults] = useState(false);
  const [selectedClientForVehicle, setSelectedClientForVehicle] = useState<any>(null);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  
  const { toast } = useToast();

  const handleNewQuote = (data?: any) => {
    if (data) {
      setNewQuote(prev => ({
        ...prev,
        cliente_nombre: data.client_name || '',
        cliente_telefono: data.client_phone || '',
        cliente_email: data.client_email || '',
        vehiculo_marca: data.vehicle?.brand || '',
        vehiculo_modelo: data.vehicle?.model || '',
        vehiculo_año: data.vehicle?.year || '',
      }));

      if (data.summary) {
        const serviceLines = data.summary.split('\n').filter((line: string) => line.trim() !== '');
        const serviceItems = serviceLines.map((line: string, index: number) => ({
          id: `${index + 1}`,
          description: line,
          price: 0,
        }));
        setQuoteItems(serviceItems.length > 0 ? serviceItems : [{ id: '1', description: '', price: 0 }]);
      } else {
        setQuoteItems([{ id: '1', description: '', price: 0 }]);
      }
    } else {
      // Reset if no data is passed
      setQuoteItems([{ id: '1', description: '', price: 0 }]);
    }
    setShowNewQuoteModal(true);
  };

  const handleNewClient = () => {
    setShowNewClientModal(true);
  };

  const handleNewVehicle = () => {
    setShowNewVehicleModal(true);
  };

  const createClient = async () => {
    if (!newClient.nombre || !newClient.telefono || !newClient.tipo_cliente) {
      toast({
        title: "Error",
        description: "Nombre, teléfono y tipo de cliente son campos requeridos",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('clientes')
        .insert([{
          nombre: newClient.nombre,
          telefono: newClient.telefono,
          email: newClient.email || null,
          tipo_cliente: newClient.tipo_cliente,
          notas: newClient.notas || null
        }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Cliente creado",
        description: `Cliente ${newClient.nombre} registrado exitosamente`,
      });

      // Reset form
      setNewClient({
        nombre: '',
        telefono: '',
        email: '',
        tipo_cliente: '',
        notas: ''
      });
      
      setShowNewClientModal(false);
      
    } catch (error) {
      console.error('Error creating client:', error);
      toast({
        title: "Error",
        description: "No se pudo crear el cliente. Intente nuevamente.",
        variant: "destructive",
      });
    }
  };

  const addQuoteItem = () => {
    const newId = (quoteItems.length + 1).toString();
    setQuoteItems([...quoteItems, { id: newId, description: '', price: 0 }]);
  };

  const removeQuoteItem = (id: string) => {
    if (quoteItems.length > 1) {
      setQuoteItems(quoteItems.filter(item => item.id !== id));
    }
  };

  const updateQuoteItem = (id: string, field: 'description' | 'price', value: string | number) => {
    setQuoteItems(quoteItems.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
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

  const createQuote = async () => {
    if (!newQuote.cliente_nombre || !newQuote.cliente_telefono || !newQuote.vehiculo_marca || !newQuote.vehiculo_modelo || !newQuote.vehiculo_año) {
      toast({
        title: "Error",
        description: "Nombre del cliente, teléfono y datos del vehículo son campos requeridos",
        variant: "destructive",
      });
      return;
    }

    console.log('Creating quote with:', { newQuote, quoteItems });

    if (quoteItems.some(item => !item.description || item.price <= 0)) {
      toast({
        title: "Error", 
        description: "Todos los servicios deben tener descripción y precio válido",
        variant: "destructive",
      });
      return;
    }

    try {
      // Generar número de cotización único: BS27 + timestamp + random
      const generateUniqueQuoteNumber = () => {
        const now = new Date();
        const timestamp = now.getTime().toString().slice(-6); // Últimos 6 dígitos del timestamp
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `BS27${timestamp}${random}`;
      };
      
      const quoteNumber = generateUniqueQuoteNumber();
      
      // Limpiar el número de teléfono (eliminar espacios y caracteres no numéricos)
      const cleanPhoneNumber = (phone: string) => {
        return phone.replace(/\D/g, '');
      };
      
      // 1. Find or create the client to get cliente_id
      let clienteId = '';
      const { data: existingClient } = await supabase
        .from('clientes')
        .select('id')
        .eq('telefono', cleanPhoneNumber(newQuote.cliente_telefono))
        .maybeSingle();

      if (existingClient) {
        clienteId = existingClient.id;
      } else {
        const { data: newClientData, error: clientError } = await supabase
          .from('clientes')
          .insert({
            nombre: newQuote.cliente_nombre,
            telefono: cleanPhoneNumber(newQuote.cliente_telefono),
            email: newQuote.cliente_email,
            tipo_cliente: 'individual' // Default value
          })
          .select('id')
          .single();
        
        if (clientError) throw clientError;
        clienteId = newClientData.id;
      }

      const vehicleInfo = `${newQuote.vehiculo_marca} ${newQuote.vehiculo_modelo} ${newQuote.vehiculo_año}`;
      const services = quoteItems.map(item => item.description).join('\n');
      const total = calculateTotal();

      // 2. Insert the quote with the correct schema
      const quoteData = {
        cliente_id: clienteId,
        vehiculo: vehicleInfo,
        problema: services,
        descripcion_trabajo: services,
        status: 'pendiente',
        precio: total,
        tipo_cliente: 'individual',
        quote_number: quoteNumber,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        quote_html: ReactDOMServer.renderToString(<QuotePreview data={{
          quote_number: quoteNumber,
            client_name: newQuote.cliente_nombre,
            client_phone: newQuote.cliente_telefono,
            client_email: newQuote.cliente_email,
            vehicle_info: vehicleInfo,
            services: quoteItems,
            subtotal: calculateSubtotal(),
            iva: calculateIVA(),
            total: total,
          }} onClose={() => {}} />)
      };
      
      const { data, error } = await supabase
        .from('cotizaciones')
        .insert([quoteData])
        .select()
        .single();

      if (error) throw error;

      // Calculate values for preview
      const previewSubtotal = calculateSubtotal();
      const previewIva = calculateIVA();
      
      // Show preview
      setQuotePreviewData({
        quote_number: quoteNumber,
        client_name: newQuote.cliente_nombre,
        client_phone: newQuote.cliente_telefono,
        client_email: newQuote.cliente_email,
        vehicle_info: vehicleInfo,
        services: quoteItems,
        subtotal: previewSubtotal,
        iva: previewIva,
        total: total,
      });
      setShowQuotePreviewModal(true);

      toast({
        title: "Cotización creada",
        description: `Cotización generada exitosamente`, 
      });

      // Reset form
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
      setShowNewQuoteModal(false);
      
    } catch (error) {
      console.error('Detailed error creating quote:', error);
      toast({
        title: "Error",
        description: "No se pudo crear la cotización. Intente nuevamente.",
        variant: "destructive",
      });
    }
  };

  // Función para buscar clientes con protección contra crashes
  const searchClients = async (searchTerm: string) => {
    console.log('🔍 Searching clients with term:', searchTerm);
    
    if (!searchTerm || !searchTerm.trim()) {
      setClientSearchResults([]);
      setShowClientResults(false);
      return;
    }

    // Protección contra caracteres especiales que pueden causar crashes
    const sanitizedTerm = searchTerm.replace(/[%_\\]/g, '\\$&');
    
    try {
      console.log('📡 Making Supabase query with sanitized term:', sanitizedTerm);
      
      // Consulta más segura con manejo de errores mejorado
      const { data, error } = await supabase
        .from('clientes')
        .select('id, nombre, telefono, email, tipo_cliente')
        .or(`nombre.ilike.%${sanitizedTerm}%,telefono.ilike.%${sanitizedTerm}%`)
        .limit(10);

      console.log('📊 Supabase response:', { data, error, searchTerm: sanitizedTerm });

      if (error) {
        console.error('❌ Supabase error:', error);
        
        // Fallback: buscar solo por nombre si la consulta OR falla
        try {
          console.log('🔄 Trying fallback query...');
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('clientes')
            .select('id, nombre, telefono, email, tipo_cliente')
            .ilike('nombre', `%${sanitizedTerm}%`)
            .limit(5);
            
          if (!fallbackError && fallbackData) {
            console.log('✅ Fallback successful:', fallbackData);
            setClientSearchResults(fallbackData);
            setShowClientResults(fallbackData.length > 0);
            return;
          }
        } catch (fallbackErr) {
          console.error('❌ Fallback also failed:', fallbackErr);
        }
        
        // Datos de prueba como último recurso
        const fakeResults = [
          {
            id: 'fake-1',
            nombre: `Cliente ${sanitizedTerm}`,
            telefono: '5551234567',
            email: 'cliente1@test.com',
            tipo_cliente: 'individual'
          }
        ];
        
        console.log('🔧 Using fake data for testing:', fakeResults);
        setClientSearchResults(fakeResults);
        setShowClientResults(true);
        
        toast({
          title: "Modo de prueba",
          description: "Usando datos de prueba - revisar conexión a base de datos",
          variant: "destructive",
        });
        return;
      }

      console.log('✅ Search results:', data);
      
      setClientSearchResults(data || []);
      setShowClientResults(data && data.length > 0);
    } catch (error) {
      console.error('💥 Critical error in searchClients:', error);
      
      // Prevenir que el error crashee la aplicación
      setClientSearchResults([]);
      setShowClientResults(false);
      
      toast({
        title: "Error de búsqueda",
        description: `Error crítico: ${error.message || 'Error desconocido'}`,
        variant: "destructive",
      });
    }
  };

  // Función para seleccionar cliente
  const selectClientForVehicle = (client: any) => {
    setSelectedClientForVehicle(client);
    setNewVehicle(prev => ({
      ...prev,
      cliente_id: client.id,
      cliente_nombre: client.nombre
    }));
    setShowClientResults(false);
    setClientSearchResults([]);
  };

  const createVehicle = async () => {
    if (!newVehicle.folio || !selectedClientForVehicle?.id || !newVehicle.marca || !newVehicle.modelo || !newVehicle.año) {
      toast({
        title: "Error",
        description: "Folio, cliente, marca, modelo y año son campos requeridos",
        variant: "destructive",
      });
      return;
    }

    try {
      const clienteId = selectedClientForVehicle.id;

      const { data, error } = await supabase
        .from('vehiculos')
        .insert([{
          folio: newVehicle.folio,
          cliente_id: clienteId,
          marca: newVehicle.marca,
          modelo: newVehicle.modelo,
          año: parseInt(newVehicle.año),
          placas: newVehicle.placas || null,
          color: newVehicle.color || null,
          problema: newVehicle.problema_reportado,
          notas: newVehicle.notas_ingreso || null,
          status_vehiculo: 'recibido'
        }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Orden creada",
        description: `Orden de taller ${newVehicle.folio} creada exitosamente`,
      });

      // Reset form
      setNewVehicle({
        folio: '',
        cliente_id: '',
        cliente_nombre: '',
        marca: '',
        modelo: '',
        año: '',
        placas: '',
        color: '',
        problema_reportado: '',
        notas_ingreso: ''
      });
      
      setSelectedClientForVehicle(null);
      setClientSearchResults([]);
      setShowClientResults(false);
      setShowNewVehicleModal(false);
      
    } catch (error) {
      console.error('Error creating vehicle order:', error);
      toast({
        title: "Error",
        description: "No se pudo crear la orden de taller. Intente nuevamente.",
        variant: "destructive",
      });
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <div className="space-y-6">
            <DashboardStats />
            
            <QuickActions onNewQuote={handleNewQuote} onNewClient={handleNewClient} onNewVehicle={handleNewVehicle} />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RecentActivity />
              <div className="lg:col-span-1">
                <VehicleStatus />
              </div>
            </div>
          </div>
        );
      case "notifications":
        return <NotificationsPage onNewQuote={handleNewQuote} />;
      case "quotes":
        return <QuotesPage />;
      case "clients":
        return <ClientsPage />;
      case "customers":
        return <CustomersPage />;
      case "vehicles":
        return <VehiclesPage />;
      case "payments":
        return (
          <ErrorBoundary>
            <PaymentsPage />
          </ErrorBoundary>
        );
      case "calendar":
        return <CalendarPage />;
      default:
        return null;
    }
  };

  return (
    <>
      <MainLayout activeTab={activeTab} onTabChange={setActiveTab}>
        {renderTabContent()}
      </MainLayout>

      {/* Modal Nuevo Cliente */}
      <Dialog open={showNewClientModal} onOpenChange={setShowNewClientModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo Cliente</DialogTitle>
            <DialogDescription>
              Registra un nuevo cliente en la base de datos
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="nombre">Nombre Completo *</Label>
              <Input
                id="nombre"
                placeholder="Nombre del cliente"
                value={newClient.nombre}
                onChange={(e) => setNewClient({...newClient, nombre: e.target.value})}
              />
            </div>
            
            <div>
              <Label htmlFor="telefono">Teléfono/WhatsApp *</Label>
              <Input
                id="telefono"
                placeholder="Número de teléfono"
                value={newClient.telefono}
                onChange={(e) => setNewClient({...newClient, telefono: e.target.value})}
              />
            </div>
            
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="correo@ejemplo.com"
                value={newClient.email}
                onChange={(e) => setNewClient({...newClient, email: e.target.value})}
              />
            </div>
            
            <div>
              <Label htmlFor="tipo_cliente">Tipo de Cliente</Label>
              <Select value={newClient.tipo_cliente} onValueChange={(value: 'individual' | 'flotilla' | 'revendedor') => setNewClient({...newClient, tipo_cliente: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona tipo de cliente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">Individual</SelectItem>
                  <SelectItem value="flotilla">Flotilla</SelectItem>
                  <SelectItem value="revendedor">Revendedor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="notas">Notas</Label>
              <Textarea
                id="notas"
                placeholder="Notas adicionales sobre el cliente"
                value={newClient.notas}
                onChange={(e) => setNewClient({...newClient, notas: e.target.value})}
              />
            </div>
          </div>
          
          <div className="flex gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setShowNewClientModal(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button 
              onClick={createClient}
              className="flex-1"
            >
              Crear Cliente
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Nueva Cotización */}
      <Dialog open={showNewQuoteModal} onOpenChange={setShowNewQuoteModal}>
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
                    onChange={(e) => setNewQuote({...newQuote, cliente_nombre: e.target.value})}
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

            {/* Servicios y Precios */}
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b pb-2">
                <h3 className="text-lg font-semibold text-foreground">Servicios y Precios</h3>
                <Button onClick={addQuoteItem} variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Servicio
                </Button>
              </div>
              
              <div className="space-y-3">
                <div className="grid grid-cols-12 gap-2 text-sm font-medium text-muted-foreground">
                  <div className="col-span-1">NO</div>
                  <div className="col-span-8">DESCRIPCIÓN DEL SERVICIO</div>
                  <div className="col-span-2">PRECIO UNITARIO</div>
                  <div className="col-span-1"></div>
                </div>
                
                {quoteItems.map((item, index) => (
                  <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-1 text-center font-medium">
                      {index + 1}-
                    </div>
                    <div className="col-span-8">
                      <Input
                        value={item.description}
                        onChange={(e) => updateQuoteItem(item.id, 'description', e.target.value)}
                        placeholder="Descripción del servicio"
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        value={item.price}
                        onChange={(e) => updateQuoteItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        step="0.01"
                      />
                    </div>
                    <div className="col-span-1">
                      {quoteItems.length > 1 && (
                        <Button
                          onClick={() => removeQuoteItem(item.id)}
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Totales */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>SUBTOTAL:</span>
                  <span>$ {calculateSubtotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>IVA (16%):</span>
                  <span>$ {calculateIVA().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold bg-blue-500 text-white px-4 py-2 rounded">
                  <span>GRAN TOTAL:</span>
                  <span>$ {calculateTotal().toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setShowNewQuoteModal(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button 
              onClick={createQuote}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              Generar Cotización
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Nueva Orden de Taller */}
      <Dialog open={showNewVehicleModal} onOpenChange={setShowNewVehicleModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nueva Orden de Taller</DialogTitle>
            <DialogDescription>
              Crear orden con FOLIO físico y relacionar cliente/cotización
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="folio">FOLIO (Número físico de la orden) *</Label>
              <Input
                id="folio"
                placeholder="Ej: OT-2024-001, 12345"
                value={newVehicle.folio}
                onChange={(e) => setNewVehicle({...newVehicle, folio: e.target.value})}
              />
              <p className="text-sm text-muted-foreground mt-1">
                Ingresa el número impreso en la orden física del taller
              </p>
            </div>

            <SimpleClientSearch
              selectedClient={selectedClientForVehicle}
              onClientSelect={(client) => {
                setSelectedClientForVehicle(client);
                setNewVehicle(prev => ({
                  ...prev,
                  cliente_id: client.id,
                  cliente_nombre: client.nombre
                }));
              }}
              onClearClient={() => {
                setSelectedClientForVehicle(null);
                setNewVehicle(prev => ({
                  ...prev,
                  cliente_id: '',
                  cliente_nombre: ''
                }));
              }}
              onNewClient={() => setShowNewClientModal(true)}
            />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="marca">Marca *</Label>
                <Input
                  id="marca"
                  placeholder="Ej: Honda, Toyota"
                  value={newVehicle.marca}
                  onChange={(e) => setNewVehicle({...newVehicle, marca: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="modelo">Modelo *</Label>
                <Input
                  id="modelo"
                  placeholder="Ej: Civic, Corolla"
                  value={newVehicle.modelo}
                  onChange={(e) => setNewVehicle({...newVehicle, modelo: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="año">Año *</Label>
                <Input
                  id="año"
                  placeholder="2020"
                  value={newVehicle.año}
                  onChange={(e) => setNewVehicle({...newVehicle, año: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="placas">Placas *</Label>
                <Input
                  id="placas"
                  placeholder="ABC-123"
                  value={newVehicle.placas}
                  onChange={(e) => setNewVehicle({...newVehicle, placas: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="color">Color</Label>
                <Input
                  id="color"
                  placeholder="Blanco, Azul"
                  value={newVehicle.color}
                  onChange={(e) => setNewVehicle({...newVehicle, color: e.target.value})}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="problema">Problema Reportado</Label>
              <Textarea
                id="problema"
                placeholder="Descripción del problema que reporta el cliente..."
                value={newVehicle.problema_reportado}
                onChange={(e) => setNewVehicle({...newVehicle, problema_reportado: e.target.value})}
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="notas">Notas de Ingreso</Label>
              <Textarea
                id="notas"
                placeholder="Condición del vehículo, observaciones del técnico, etc."
                value={newVehicle.notas_ingreso}
                onChange={(e) => setNewVehicle({...newVehicle, notas_ingreso: e.target.value})}
                rows={3}
              />
            </div>
          </div>
          
          <div className="flex gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setShowNewVehicleModal(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button 
              onClick={createVehicle}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              Crear Orden
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Vista Previa de Cotización */}
      <Dialog open={showQuotePreviewModal} onOpenChange={setShowQuotePreviewModal}>
        <QuotePreview data={quotePreviewData} onClose={() => setShowQuotePreviewModal(false)} />
      </Dialog>
    </>
  );
};

export default Index;
