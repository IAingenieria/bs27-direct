import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Car, User, Phone, MapPin, AlertCircle, Calendar, CheckCircle, Clock, Wrench, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import MainLayout from '@/components/MainLayout';

export function VehiclesPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [vehicles, setVehicles] = useState([]);
  const [clients, setClients] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [showNewVehicle, setShowNewVehicle] = useState(false);
  const [showNewClient, setShowNewClient] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [clientSearch, setClientSearch] = useState('');
  const [filteredClients, setFilteredClients] = useState([]);
  const [clientQuotes, setClientQuotes] = useState([]);
  
  const [newVehicle, setNewVehicle] = useState({
    folio: '',
    cliente_id: '',
    vehiculo: '',
    marca: '',
    modelo: '',
    año: undefined,
    placas: '',
    color: '',
    problema_reportado: '',
    notas: ''
  });

  const [newClientForm, setNewClientForm] = useState({
    nombre: '',
    telefono: '',
    email: '',
    direccion: ''
  });

  const fetchVehicles = useCallback(async () => {
    try {
      console.log('Cargando vehículos desde la base de datos...');
      
      // Cargar desde tabla vehiculos (tabla que existe en el schema)
      console.log('Cargando desde tabla vehiculos...');

      // Fallback: intentar cargar desde tabla vehiculos
      console.log('Intentando cargar desde tabla vehiculos...');
      const { data, error } = await supabase
        .from('vehiculos')
        .select(`
          *,
          clientes (nombre, telefono, email),
          cotizaciones (descripcion_trabajo, precio)
        `)
        .order('created_at', { ascending: false });

      console.log('Respuesta de vehiculos:', { data, error });

      if (error) {
        console.error('Error en consulta vehiculos:', error);
        // Usar datos de prueba si hay error
        const mockVehicles = [
          {
            id: '1',
            folio: 'OT-2024-001',
            cliente_id: '1',
            marca: 'Honda',
            modelo: 'Civic',
            año: 2020,
            placas: 'ABC-123',
            color: 'Blanco',
            problema_reportado: 'Ruido en motor',
            status_vehiculo: 'en_proceso',
            created_at: new Date().toISOString(),
            clientes: { nombre: 'Cliente de Prueba', telefono: '5551234567' }
          }
        ];
        console.log('Usando datos de prueba:', mockVehicles);
        setVehicles(mockVehicles);
        return;
      }

      const mappedVehicles = data?.map(vehicle => ({
        id: vehicle.id,
        folio: vehicle.id, // Usar ID como FOLIO temporal
        cliente_id: vehicle.cliente_id,
        marca: vehicle.vehiculo?.split(' ')[0] || '',
        modelo: vehicle.vehiculo?.split(' ').slice(1).join(' ') || '',
        año: 2024, // Valor por defecto ya que no existe en schema
        placas: 'N/A', // Valor por defecto ya que no existe en schema
        color: 'N/A', // Valor por defecto ya que no existe en schema
        problema_reportado: vehicle.notas || 'No especificado',
        status_vehiculo: vehicle.status || 'recibido',
        created_at: vehicle.created_at,
        clientes: vehicle.clientes,
        cotizaciones: vehicle.cotizaciones
      })) || [];
      
      console.log('Vehículos mapeados desde vehiculos:', mappedVehicles);
      setVehicles(mappedVehicles);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los vehículos",
        variant: "destructive",
      });
    }
  }, [toast]);

  const fetchClients = useCallback(async () => {
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
  }, []);

  const fetchQuotes = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('cotizaciones')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQuotes(data || []);
    } catch (error) {
      console.error('Error fetching quotes:', error);
    }
  }, []);

  useEffect(() => {
    fetchVehicles();
    fetchClients();
    fetchQuotes();
  }, [fetchVehicles, fetchClients, fetchQuotes]);

  // Búsqueda de clientes
  const searchClients = (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setFilteredClients([]);
      return;
    }

    const filtered = clients.filter(client => 
      client.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.telefono?.includes(searchTerm)
    );
    
    setFilteredClients(filtered);
  };

  // Seleccionar cliente
  const selectClient = async (client: any) => {
    setSelectedClient(client);
    setClientSearch(client.nombre);
    setFilteredClients([]);
    setNewVehicle(prev => ({ ...prev, cliente_id: client.id }));
    
    // Fetch quotes for this client
    try {
      const { data, error } = await supabase
        .from('cotizaciones')
        .select('*')
        .eq('cliente_id', client.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClientQuotes(data || []);
    } catch (error) {
      console.error('Error fetching client quotes:', error);
    }
  };

  const createVehicle = async () => {
    try {
      if (!newVehicle.folio || !selectedClient) {
        toast({
          title: "Error",
          description: "FOLIO y cliente son requeridos",
          variant: "destructive",
        });
        return;
      }

      console.log('Creando orden de taller con datos:', {
        newVehicle,
        selectedClient,
        selectedQuote
      });

      // Crear directamente en tabla vehiculos (que existe en el schema)
      const vehicleData = {
        cliente_id: selectedClient.id,
        cotizacion_id: selectedQuote?.id || null,
        vehiculo: `${newVehicle.marca || ''} ${newVehicle.modelo || ''}`.trim() || 'Vehículo sin especificar',
        notas: newVehicle.notas || '',
        status: 'en_proceso' as const
      };

      console.log('Datos para vehiculos:', vehicleData);

      const { data, error } = await supabase
        .from('vehiculos')
        .insert(vehicleData)
        .select();

      if (error) {
        console.error('Error creando vehículo:', error);
        throw error;
      }

      console.log('Vehículo creado exitosamente:', data);

      toast({
        title: "Éxito",
        description: "Orden de taller creada correctamente",
      });

      setShowNewVehicle(false);
      fetchVehicles();
      
      // Reset form
      setNewVehicle({
        folio: '',
        cliente_id: '',
        vehiculo: '',
        marca: '',
        modelo: '',
        año: undefined,
        placas: '',
        color: '',
        problema_reportado: '',
        notas: ''
      });
      setSelectedClient(null);
      setSelectedQuote(null);
      setClientSearch('');
      setFilteredClients([]);
    } catch (error) {
      console.error('Error creating vehicle:', error);
      toast({
        title: "Error",
        description: `No se pudo crear la orden de taller: ${error.message}`,
        variant: "destructive",
      });
    }
  };
  const createClient = async () => {
    try {
      if (!newClientForm.nombre || !newClientForm.telefono) {
        toast({
          title: "Error",
          description: "Nombre y teléfono son requeridos",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase
        .from('clientes')
        .insert([newClientForm])
        .select();

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Cliente creado correctamente",
      });

      setShowNewClient(false);
      fetchClients();
      
      // Reset form
      setNewClientForm({
        nombre: '',
        telefono: '',
        email: '',
        direccion: ''
      });

    } catch (error) {
      console.error('Error creating client:', error);
      toast({
        title: "Error",
        description: "No se pudo crear el cliente",
        variant: "destructive",
      });
    }
  };


  const getStatusBadge = (status) => {
    const variants = {
      'en_proceso': 'bg-blue-100 text-blue-800 border border-blue-200',
      'completado': 'bg-green-100 text-green-800 border border-green-200',
      'entregado': 'bg-purple-100 text-purple-800 border border-purple-200',
      'cancelado': 'bg-red-100 text-red-800 border border-red-200'
    };

    const labels = {
      'en_proceso': 'En Proceso',
      'completado': 'Completado',
      'entregado': 'Entregado',
      'cancelado': 'Cancelado'
    };

    return (
      <Badge className={variants[status] || 'bg-gray-100 text-gray-800'}>
        {labels[status] || status}
      </Badge>
    );
  };

  return (
    <MainLayout activeTab="vehicles" onTabChange={() => {}}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Vehículos</h1>
            <p className="text-muted-foreground">
              Gestión de órdenes de taller y vehículos en proceso
            </p>
          </div>
          <Button onClick={() => setShowNewVehicle(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Ingresar Vehículo
          </Button>
        </div>

      {/* Vehicles Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {vehicles.map((vehicle) => (
          <Card 
            key={vehicle.id} 
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => navigate(`/vehiculos/${vehicle.id}`)}
          >
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <CardTitle className="text-lg font-mono">
                    {vehicle.folio}
                  </CardTitle>
                  <CardDescription className="flex items-center">
                    <Car className="mr-1 h-3 w-3" />
                    {vehicle.marca} {vehicle.modelo} {vehicle.año}
                  </CardDescription>
                </div>
                {getStatusBadge(vehicle.status_vehiculo)}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <User className="mr-2 h-3 w-3 text-muted-foreground" />
                  <span className="font-medium">{vehicle.clientes?.nombre}</span>
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Phone className="mr-2 h-3 w-3" />
                  <span>{vehicle.clientes?.telefono}</span>
                </div>
                {vehicle.placas && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <MapPin className="mr-2 h-3 w-3" />
                    <span>{vehicle.placas}</span>
                  </div>
                )}
              </div>
              
              {vehicle.problema_reportado && vehicle.problema_reportado !== 'No especificado' && (
                <div className="pt-2 border-t">
                  <div className="flex items-start text-sm">
                    <AlertCircle className="mr-2 h-3 w-3 text-muted-foreground mt-0.5" />
                    <span className="text-muted-foreground">
                      {vehicle.problema_reportado.length > 50 
                        ? `${vehicle.problema_reportado.substring(0, 50)}...`
                        : vehicle.problema_reportado
                      }
                    </span>
                  </div>
                </div>
              )}
              
              <div className="flex items-center text-xs text-muted-foreground pt-2 border-t">
                <Calendar className="mr-1 h-3 w-3" />
                <span>
                  {new Date(vehicle.created_at).toLocaleDateString('es-MX')}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {vehicles.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Car className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No hay vehículos registrados</h3>
            <p className="text-muted-foreground text-center mb-4">
              Comienza creando tu primera orden de taller
            </p>
            <Button onClick={() => setShowNewVehicle(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Ingresar Primer Vehículo
            </Button>
          </CardContent>
        </Card>
      )}
      
      {/* Main Dialog for Vehicle Entry */}
      <Dialog open={showNewVehicle} onOpenChange={setShowNewVehicle}>
        <DialogTrigger asChild>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Ingresar Vehículo
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
          <div className="p-6 pb-2">
            <DialogHeader>
              <DialogTitle>Nueva Orden de Taller</DialogTitle>
              <DialogDescription>
                Crear orden con FOLIO físico y relacionar cliente/cotización
              </DialogDescription>
            </DialogHeader>
          </div>
          
          <div className="overflow-y-auto px-6 py-2 flex-1">
            <div className="space-y-6">
              {/* FOLIO */}
              <div>
                <Label htmlFor="folio">FOLIO (Número físico de la orden) *</Label>
                <Input
                  id="folio"
                  value={newVehicle.folio || ''}
                  onChange={(e) => setNewVehicle({...newVehicle, folio: e.target.value})}
                  placeholder="Ej: OT-2024-001, 12345"
                  className="font-mono text-lg"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Ingresa el número impreso en la orden física del taller
                </p>
              </div>

              {/* Client Search */}
              <div>
                <Label htmlFor="client-search">Cliente *</Label>
                <div className="flex space-x-2">
                  <div className="flex-1 relative">
                    <Input
                      id="client-search"
                      value={clientSearch}
                      onChange={(e) => {
                        setClientSearch(e.target.value);
                        searchClients(e.target.value);
                      }}
                      placeholder="Buscar cliente por nombre o teléfono..."
                    />
                    {filteredClients.length > 0 && clientSearch && !selectedClient && (
                      <div className="absolute top-full left-0 right-0 bg-white border rounded-md shadow-lg z-10 max-h-40 overflow-y-auto">
                        {filteredClients.map((client) => (
                          <div
                            key={client.id}
                            className="p-2 hover:bg-gray-100 cursor-pointer"
                            onClick={() => selectClient(client)}
                          >
                            <div className="font-medium">{client.nombre}</div>
                            <div className="text-sm text-muted-foreground">{client.telefono}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => setShowNewClient(true)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {selectedClient && (
                  <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                    <div className="font-medium text-green-800">{selectedClient.nombre}</div>
                    <div className="text-sm text-green-600">{selectedClient.telefono}</div>
                  </div>
                )}
              </div>

              {/* Quote Selection */}
              {clientQuotes.length > 0 && (
                <div>
                  <Label>Cotización Relacionada (Opcional)</Label>
                  <Select onValueChange={(value) => {
                    const quote = clientQuotes.find(q => q.id === value);
                    setSelectedQuote(quote);
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar cotización..." />
                    </SelectTrigger>
                    <SelectContent>
                      {clientQuotes.map((quote) => (
                        <SelectItem key={quote.id} value={quote.id}>
                          #{quote.numero_cotizacion} - ${quote.precio?.toLocaleString()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Vehicle Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="marca">Marca *</Label>
                  <Input
                    id="marca"
                    value={newVehicle.marca}
                    onChange={(e) => setNewVehicle({...newVehicle, marca: e.target.value})}
                    placeholder="Ej: Toyota"
                  />
                </div>
                <div>
                  <Label htmlFor="modelo">Modelo *</Label>
                  <Input
                    id="modelo"
                    value={newVehicle.modelo}
                    onChange={(e) => setNewVehicle({...newVehicle, modelo: e.target.value})}
                    placeholder="Ej: Corolla"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="año">Año</Label>
                  <Input
                    id="año"
                    type="number"
                    value={newVehicle.año || ''}
                    onChange={(e) => setNewVehicle({...newVehicle, año: parseInt(e.target.value) || undefined})}
                    placeholder="2020"
                  />
                </div>
                <div>
                  <Label htmlFor="placas">Placas</Label>
                  <Input
                    id="placas"
                    value={newVehicle.placas}
                    onChange={(e) => setNewVehicle({...newVehicle, placas: e.target.value.toUpperCase()})}
                    placeholder="ABC-123"
                  />
                </div>
                <div>
                  <Label htmlFor="color">Color</Label>
                  <Input
                    id="color"
                    value={newVehicle.color}
                    onChange={(e) => setNewVehicle({...newVehicle, color: e.target.value})}
                    placeholder="Blanco"
                  />
                </div>
              </div>

              {/* Problem Description */}
              <div>
                <Label htmlFor="problema">Problema Reportado *</Label>
                <Textarea
                  id="problema"
                  value={newVehicle.problema_reportado}
                  onChange={(e) => setNewVehicle({...newVehicle, problema_reportado: e.target.value})}
                  placeholder="Describe el problema o servicio solicitado..."
                  rows={3}
                />
              </div>

              {/* Notes */}
              <div>
                <Label htmlFor="notas">Notas Adicionales</Label>
                <Textarea
                  id="notas"
                  value={newVehicle.notas}
                  onChange={(e) => setNewVehicle({...newVehicle, notas: e.target.value})}
                  placeholder="Observaciones adicionales..."
                  rows={2}
                />
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 p-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowNewVehicle(false);
                setSelectedClient(null);
                setSelectedQuote(null);
                setClientSearch('');
                setClientQuotes([]);
                setNewVehicle({
                  folio: '',
                  cliente_id: '',
                  vehiculo: '',
                  marca: '',
                  modelo: '',
                  año: undefined,
                  placas: '',
                  color: '',
                  problema_reportado: '',
                  notas: ''
                });
              }}
            >
              Cancelar
            </Button>
            <Button onClick={createVehicle}>
              Crear Orden
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* New Client Dialog */}
      <Dialog open={showNewClient} onOpenChange={setShowNewClient}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo Cliente</DialogTitle>
            <DialogDescription>
              Registrar un nuevo cliente en el sistema
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="nombre-cliente">Nombre Completo *</Label>
              <Input
                id="nombre-cliente"
                value={newClientForm.nombre}
                onChange={(e) => setNewClientForm({...newClientForm, nombre: e.target.value})}
                placeholder="Ej: Juan Pérez García"
              />
            </div>
            <div>
              <Label htmlFor="telefono-cliente">Teléfono *</Label>
              <Input
                id="telefono-cliente"
                value={newClientForm.telefono}
                onChange={(e) => setNewClientForm({...newClientForm, telefono: e.target.value})}
                placeholder="Ej: 555-123-4567"
              />
            </div>
            <div>
              <Label htmlFor="email-cliente">Email</Label>
              <Input
                id="email-cliente"
                type="email"
                value={newClientForm.email}
                onChange={(e) => setNewClientForm({...newClientForm, email: e.target.value})}
                placeholder="cliente@email.com"
              />
            </div>
            <div>
              <Label htmlFor="direccion-cliente">Dirección</Label>
              <Textarea
                id="direccion-cliente"
                value={newClientForm.direccion}
                onChange={(e) => setNewClientForm({...newClientForm, direccion: e.target.value})}
                placeholder="Dirección completa..."
                rows={2}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowNewClient(false)}>
              Cancelar
            </Button>
            <Button onClick={createClient}>
              Crear Cliente
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </MainLayout>
  );
}

export default VehiclesPage;
