import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Users, Plus, Edit, Trash2, Search, Phone, Mail, MapPin, Calendar, Filter, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Client {
  id: string;
  nombre: string;
  telefono: string;
  email: string | null;
  tipo_cliente: 'individual' | 'flotilla' | 'revendedor';
  notas: string | null;
  created_at: string;
  updated_at: string;
  cotizaciones?: Array<{ id: string; numero_cotizacion: string }>;
}

const ClientsPage = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [showNewClient, setShowNewClient] = useState(false);
  const [showEditClient, setShowEditClient] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showQuoteDetails, setShowQuoteDetails] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedQuote, setSelectedQuote] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'todos' | 'individual' | 'flotilla' | 'revendedor'>('todos');
  
  const [newClient, setNewClient] = useState({
    nombre: '',
    telefono: '',
    email: '',
    tipo_cliente: '' as 'individual' | 'flotilla' | 'revendedor' | '',
    notas: ''
  });

  const { toast } = useToast();

  const navigateToQuote = async (quoteId: string) => {
    try {
      const { data, error } = await supabase
        .from('cotizaciones')
        .select(`
          *,
          clientes (nombre, telefono, email)
        `)
        .eq('id', quoteId)
        .single();

      if (error) throw error;

      setSelectedQuote(data);
      setShowQuoteDetails(true);
    } catch (error) {
      console.error('Error fetching quote details:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar la cotización",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    filterClients();
  }, [clients, searchTerm, filterType]);

  const fetchClients = async () => {
    try {
      // Primero intentar sin las cotizaciones para verificar si el problema es la relación
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Luego obtener las cotizaciones por separado
      const clientsWithQuotes = await Promise.all(
        (data || []).map(async (client) => {
          const { data: quotes, error: quotesError } = await supabase
            .from('cotizaciones')
            .select('id')
            .eq('cliente_id', client.id);
          
          if (quotesError) {
            console.error('Error fetching quotes for client:', client.id, quotesError);
            return { ...client, cotizaciones: [] };
          }
          
          // Generar números de cotización basados en el ID o fecha
          const cotizaciones = quotes?.map(quote => ({
            id: quote.id,
            numero_cotizacion: `BS27${quote.id.slice(-8).toUpperCase()}`
          })) || [];
          
          return { ...client, cotizaciones };
        })
      );
      
      setClients(clientsWithQuotes);
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los clientes",
        variant: "destructive",
      });
    }
  };

  const filterClients = () => {
    let filtered = clients;

    // Filtrar por término de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(client =>
        client.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.telefono.includes(searchTerm) ||
        (client.email && client.email.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filtrar por tipo de cliente
    if (filterType !== 'todos') {
      filtered = filtered.filter(client => client.tipo_cliente === filterType);
    }

    setFilteredClients(filtered);
  };

  const resetForm = () => {
    setNewClient({
      nombre: '',
      telefono: '',
      email: '',
      tipo_cliente: '',
      notas: ''
    });
  };

  const createClient = async () => {
    try {
      // Validaciones
      if (!newClient.nombre.trim()) {
        toast({
          title: "Error",
          description: "El nombre del cliente es obligatorio",
          variant: "destructive",
        });
        return;
      }

      if (!newClient.telefono.trim()) {
        toast({
          title: "Error",
          description: "El teléfono del cliente es obligatorio",
          variant: "destructive",
        });
        return;
      }

      if (!newClient.tipo_cliente) {
        toast({
          title: "Error",
          description: "Debes seleccionar un tipo de cliente",
          variant: "destructive",
        });
        return;
      }

      // Verificar si ya existe un cliente con el mismo teléfono
      const { data: existingClient, error: checkError } = await supabase
        .from('clientes')
        .select('id')
        .eq('telefono', newClient.telefono)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingClient) {
        toast({
          title: "Error",
          description: "Ya existe un cliente con este número de teléfono",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('clientes')
        .insert({
          nombre: newClient.nombre.trim(),
          telefono: newClient.telefono.trim(),
          email: newClient.email.trim() || null,
          tipo_cliente: newClient.tipo_cliente,
          notas: newClient.notas.trim() || null
        });

      if (error) throw error;

      toast({
        title: "Cliente creado",
        description: "El cliente ha sido registrado exitosamente",
      });

      resetForm();
      setShowNewClient(false);
      fetchClients();
    } catch (error) {
      console.error('Error creating client:', error);
      toast({
        title: "Error",
        description: `No se pudo crear el cliente: ${error.message || error}`,
        variant: "destructive",
      });
    }
  };

  const updateClient = async () => {
    if (!selectedClient) return;

    try {
      // Validaciones
      if (!newClient.nombre.trim()) {
        toast({
          title: "Error",
          description: "El nombre del cliente es obligatorio",
          variant: "destructive",
        });
        return;
      }

      if (!newClient.telefono.trim()) {
        toast({
          title: "Error",
          description: "El teléfono del cliente es obligatorio",
          variant: "destructive",
        });
        return;
      }

      // Verificar si ya existe otro cliente con el mismo teléfono
      const { data: existingClient, error: checkError } = await supabase
        .from('clientes')
        .select('id')
        .eq('telefono', newClient.telefono)
        .neq('id', selectedClient.id)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingClient) {
        toast({
          title: "Error",
          description: "Ya existe otro cliente con este número de teléfono",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('clientes')
        .update({
          nombre: newClient.nombre.trim(),
          telefono: newClient.telefono.trim(),
          email: newClient.email.trim() || null,
          tipo_cliente: newClient.tipo_cliente,
          notas: newClient.notas.trim() || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedClient.id);

      if (error) throw error;

      toast({
        title: "Cliente actualizado",
        description: "Los datos del cliente han sido actualizados exitosamente",
      });

      resetForm();
      setShowEditClient(false);
      setSelectedClient(null);
      fetchClients();
    } catch (error) {
      console.error('Error updating client:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el cliente",
        variant: "destructive",
      });
    }
  };

  const deleteClient = async () => {
    if (!selectedClient) return;

    try {
      // Verificar si el cliente tiene cotizaciones asociadas
      const { data: quotes } = await supabase
        .from('cotizaciones')
        .select('id')
        .eq('cliente_id', selectedClient.id)
        .limit(1);

      if (quotes && quotes.length > 0) {
        toast({
          title: "No se puede eliminar",
          description: "Este cliente tiene cotizaciones asociadas. No se puede eliminar.",
          variant: "destructive",
        });
        setShowDeleteDialog(false);
        setSelectedClient(null);
        return;
      }

      const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', selectedClient.id);

      if (error) throw error;

      toast({
        title: "Cliente eliminado",
        description: "El cliente ha sido eliminado exitosamente",
      });

      setShowDeleteDialog(false);
      setSelectedClient(null);
      fetchClients();
    } catch (error) {
      console.error('Error deleting client:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el cliente",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (client: Client) => {
    setSelectedClient(client);
    setNewClient({
      nombre: client.nombre,
      telefono: client.telefono,
      email: client.email || '',
      tipo_cliente: client.tipo_cliente,
      notas: client.notas || ''
    });
    setShowEditClient(true);
  };

  const openDeleteDialog = (client: Client) => {
    setSelectedClient(client);
    setShowDeleteDialog(true);
  };

  const getClientTypeBadge = (type: string) => {
    switch (type) {
      case 'flotilla':
        return (
          <Badge className="bg-blue-100 text-blue-800 border border-blue-200">
            Flotilla
          </Badge>
        );
      case 'revendedor':
        return (
          <Badge className="bg-purple-100 text-purple-800 border border-purple-200">
            Revendedor
          </Badge>
        );
      default:
        return (
          <Badge className="bg-green-100 text-green-800 border border-green-200">
            Individual
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header con botón Nuevo Cliente */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Clientes</h1>
          <p className="text-muted-foreground">Gestiona la base de datos de clientes del taller</p>
        </div>
        
        <Button 
          onClick={() => setShowNewClient(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Cliente
        </Button>
      </div>

      {/* Filtros y Búsqueda */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar por nombre, teléfono o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <Select value={filterType} onValueChange={(value: 'todos' | 'individual' | 'flotilla' | 'revendedor') => setFilterType(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="individual">Individual</SelectItem>
                  <SelectItem value="flotilla">Flotilla</SelectItem>
                  <SelectItem value="revendedor">Revendedor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Clientes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Clientes Registrados ({filteredClients.length})
          </CardTitle>
          <CardDescription>
            Base de datos completa de clientes del taller
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredClients.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hay clientes registrados</p>
              <p className="text-sm">Crea tu primer cliente usando el botón de arriba</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredClients.map((client) => (
                <Card key={client.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div>
                          <h3 className="font-semibold text-lg">{client.nombre}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            {getClientTypeBadge(client.tipo_cliente)}
                            <span className="text-sm text-muted-foreground">
                              Registrado: {new Date(client.created_at).toLocaleDateString('es-MX')}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(client)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDeleteDialog(client)}
                          className="text-red-600 hover:text-red-800 border-red-200 hover:border-red-300"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Eliminar
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{client.telefono}</span>
                      </div>
                      {client.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{client.email}</span>
                        </div>
                      )}
                    </div>

                    {/* Números de Cotización */}
                    {client.cotizaciones && client.cotizaciones.length > 0 && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm font-medium text-blue-800 mb-2">
                          Cotizaciones ({client.cotizaciones.length}):
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {client.cotizaciones.map((cotizacion) => (
                            <Badge 
                              key={cotizacion.id} 
                              variant="outline" 
                              className="bg-white border-blue-300 text-blue-700 hover:bg-blue-100 cursor-pointer transition-all hover:shadow-md"
                              onClick={() => navigateToQuote(cotizacion.id)}
                            >
                              {cotizacion.numero_cotizacion}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {client.notas && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-muted-foreground">
                          <strong>Notas:</strong> {client.notas}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Nuevo Cliente */}
      <Dialog open={showNewClient} onOpenChange={(open) => {
        setShowNewClient(open);
        if (!open) {
          resetForm();
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nuevo Cliente</DialogTitle>
            <DialogDescription>
              Registra un nuevo cliente en la base de datos
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nombre">Nombre Completo *</Label>
                <Input
                  id="nombre"
                  value={newClient.nombre}
                  onChange={(e) => setNewClient({...newClient, nombre: e.target.value})}
                  placeholder="Nombre del cliente"
                />
              </div>
              <div>
                <Label htmlFor="telefono">Teléfono/WhatsApp *</Label>
                <Input
                  id="telefono"
                  value={newClient.telefono}
                  onChange={(e) => setNewClient({...newClient, telefono: e.target.value})}
                  placeholder="Número de teléfono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newClient.email}
                  onChange={(e) => setNewClient({...newClient, email: e.target.value})}
                  placeholder="correo@ejemplo.com"
                />
              </div>
              <div>
                <Label htmlFor="tipo_cliente">Tipo de Cliente</Label>
                <select 
                  value={newClient.tipo_cliente} 
                  onChange={(e) => setNewClient({...newClient, tipo_cliente: e.target.value as 'individual' | 'flotilla' | 'revendedor'})}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Selecciona tipo de cliente</option>
                  <option value="individual">Individual</option>
                  <option value="flotilla">Flotilla</option>
                  <option value="revendedor">Revendedor</option>
                </select>
              </div>
            </div>


            <div>
              <Label htmlFor="notas">Notas</Label>
              <Textarea
                id="notas"
                value={newClient.notas}
                onChange={(e) => setNewClient({...newClient, notas: e.target.value})}
                placeholder="Notas adicionales sobre el cliente"
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => {
                setShowNewClient(false);
                resetForm();
              }}>
                Cancelar
              </Button>
              <Button onClick={createClient}>
                Crear Cliente
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Editar Cliente */}
      <Dialog open={showEditClient} onOpenChange={(open) => {
        setShowEditClient(open);
        if (!open) {
          resetForm();
          setSelectedClient(null);
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Cliente</DialogTitle>
            <DialogDescription>
              Modifica los datos del cliente seleccionado
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_nombre">Nombre Completo *</Label>
                <Input
                  id="edit_nombre"
                  value={newClient.nombre}
                  onChange={(e) => setNewClient({...newClient, nombre: e.target.value})}
                  placeholder="Nombre del cliente"
                />
              </div>
              <div>
                <Label htmlFor="edit_telefono">Teléfono/WhatsApp *</Label>
                <Input
                  id="edit_telefono"
                  value={newClient.telefono}
                  onChange={(e) => setNewClient({...newClient, telefono: e.target.value})}
                  placeholder="Número de teléfono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_email">Email</Label>
                <Input
                  id="edit_email"
                  type="email"
                  value={newClient.email}
                  onChange={(e) => setNewClient({...newClient, email: e.target.value})}
                  placeholder="correo@ejemplo.com"
                />
              </div>
              <div>
                <Label htmlFor="edit_tipo_cliente">Tipo de Cliente</Label>
                <select 
                  value={newClient.tipo_cliente} 
                  onChange={(e) => setNewClient({...newClient, tipo_cliente: e.target.value as 'individual' | 'flotilla' | 'revendedor'})}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Selecciona tipo de cliente</option>
                  <option value="individual">Individual</option>
                  <option value="flotilla">Flotilla</option>
                  <option value="revendedor">Revendedor</option>
                </select>
              </div>
            </div>


            <div>
              <Label htmlFor="edit_notas">Notas</Label>
              <Textarea
                id="edit_notas"
                value={newClient.notas}
                onChange={(e) => setNewClient({...newClient, notas: e.target.value})}
                placeholder="Notas adicionales sobre el cliente"
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => {
                setShowEditClient(false);
                setSelectedClient(null);
                resetForm();
              }}>
                Cancelar
              </Button>
              <Button onClick={updateClient}>
                Actualizar Cliente
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Confirmar Eliminación */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar Cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el cliente{' '}
              <strong>{selectedClient?.nombre}</strong> de la base de datos.
              {selectedClient && (
                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-sm text-yellow-800">
                    <strong>Nota:</strong> Si este cliente tiene cotizaciones asociadas, no se podrá eliminar.
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowDeleteDialog(false);
              setSelectedClient(null);
            }}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteClient}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar Cliente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal Detalles de Cotización */}
      <Dialog open={showQuoteDetails} onOpenChange={setShowQuoteDetails}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Detalles de Cotización
            </DialogTitle>
            <DialogDescription>
              Información completa de la cotización seleccionada
            </DialogDescription>
          </DialogHeader>
          
          {selectedQuote && (
            <div className="space-y-6">
              {/* Información del Cliente */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Información del Cliente</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{selectedQuote.clientes?.nombre}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedQuote.clientes?.telefono}</span>
                    </div>
                    {selectedQuote.clientes?.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedQuote.clientes?.email}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Detalles de la Cotización */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Detalles de la Cotización</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-muted-foreground">Vehículo</p>
                        <p className="font-medium">{selectedQuote.vehiculo}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Problema</p>
                        <p className="font-medium">{selectedQuote.problema}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Estado</p>
                        <Badge className={`${
                          selectedQuote.status === 'aceptada' ? 'bg-green-100 text-green-800' :
                          selectedQuote.status === 'en_proceso' ? 'bg-blue-100 text-blue-800' :
                          selectedQuote.status === 'rechazada' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {selectedQuote.status?.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-muted-foreground">Precio Total</p>
                        <p className="text-3xl font-bold text-green-600">
                          ${selectedQuote.precio?.toLocaleString('es-MX')}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Fecha de Creación</p>
                        <p className="font-medium">
                          {new Date(selectedQuote.fecha_creacion).toLocaleDateString('es-MX')}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setShowQuoteDetails(false)}>
                  Cerrar
                </Button>
                <Button onClick={() => {
                  // Aquí puedes agregar funcionalidad para editar o imprimir la cotización
                  toast({
                    title: "Funcionalidad próximamente",
                    description: "Edición de cotización estará disponible pronto",
                  });
                }}>
                  Editar Cotización
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClientsPage;
