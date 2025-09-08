import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Users, Plus, Phone, Mail, Calendar, DollarSign, Wrench } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Customer {
  id: string;
  nombre: string;
  telefono: string;
  email: string | null;
  tipo_cliente: 'individual' | 'flotilla' | 'revendedor';
  fecha_registro: string;
  ultimo_contacto: string | null;
  proximo_seguimiento: string | null;
  valor_total: number;
  trabajos_realizados: number;
  notas: string | null;
  activo: boolean;
}

const CustomersPage = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const { toast } = useToast();

  const [newCustomer, setNewCustomer] = useState({
    nombre: '',
    telefono: '',
    email: '',
    tipo_cliente: 'individual' as const,
    proximo_seguimiento: '',
    notas: '',
    // Datos del vehículo
    vehiculo_marca: '',
    vehiculo_modelo: '',
    vehiculo_año: '',
    vehiculo_color: '',
    problema: ''
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    filterCustomers();
  }, [customers, searchTerm, filterType]);

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('activo', true)
        .order('fecha_registro', { ascending: false });

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los clientes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterCustomers = () => {
    let filtered = customers;

    if (searchTerm) {
      filtered = filtered.filter(customer =>
        customer.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.telefono.includes(searchTerm) ||
        (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(customer => customer.tipo_cliente === filterType);
    }

    setFilteredCustomers(filtered);
  };

  const createCustomer = async () => {
    if (!newCustomer.nombre || !newCustomer.telefono) {
      toast({
        title: "Error",
        description: "Nombre y teléfono son campos requeridos",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('clientes')
        .insert({
          nombre: newCustomer.nombre,
          telefono: newCustomer.telefono,
          email: newCustomer.email || null,
          tipo_cliente: newCustomer.tipo_cliente,
          proximo_seguimiento: newCustomer.proximo_seguimiento || null,
          notas: newCustomer.notas || null
        });

      if (error) throw error;

      toast({
        title: "Cliente creado",
        description: "El cliente ha sido registrado exitosamente",
      });

      setNewCustomer({
        nombre: '',
        telefono: '',
        email: '',
        tipo_cliente: 'individual',
        proximo_seguimiento: '',
        notas: ''
      });
      setShowNewCustomer(false);
      fetchCustomers();
    } catch (error) {
      console.error('Error creating customer:', error);
      toast({
        title: "Error",
        description: "No se pudo crear el cliente",
        variant: "destructive",
      });
    }
  };

  const getTypeBadge = (tipo: string) => {
    const variants = {
      individual: 'bg-info-light text-info border border-info/20',
      flotilla: 'bg-purple-light text-purple border border-purple/20',
      revendedor: 'bg-success-light text-success border border-success/20'
    };

    return (
      <Badge className={variants[tipo as keyof typeof variants] || 'bg-slate-light text-slate border border-slate/20'}>
        {tipo === 'individual' ? 'Individual' : tipo === 'flotilla' ? 'Flotilla' : 'Revendedor'}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">CRM de Clientes</h1>
          <p className="text-muted-foreground">
            Gestiona la base de datos de clientes del taller
          </p>
        </div>
        <Dialog open={showNewCustomer} onOpenChange={setShowNewCustomer}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Registrar Nuevo Cliente</DialogTitle>
              <DialogDescription>
                Completa los datos del cliente para agregarlo al sistema
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              {/* Datos del Cliente */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground border-b pb-2">Datos del Cliente</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nombre">Nombre Completo *</Label>
                    <Input
                      id="nombre"
                      value={newCustomer.nombre}
                      onChange={(e) => setNewCustomer({...newCustomer, nombre: e.target.value})}
                      placeholder="Nombre del cliente"
                    />
                  </div>
                  <div>
                    <Label htmlFor="telefono">Teléfono *</Label>
                    <Input
                      id="telefono"
                      value={newCustomer.telefono}
                      onChange={(e) => setNewCustomer({...newCustomer, telefono: e.target.value})}
                      placeholder="+52 81 1234-5678"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newCustomer.email}
                      onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
                      placeholder="cliente@email.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="tipo">Tipo de Cliente</Label>
                    <Select value={newCustomer.tipo_cliente} onValueChange={(value: any) => setNewCustomer({...newCustomer, tipo_cliente: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="individual">Individual</SelectItem>
                        <SelectItem value="flotilla">Flotilla</SelectItem>
                        <SelectItem value="revendedor">Revendedor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Datos del Vehículo */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground border-b pb-2">Datos del Vehículo</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="marca">Marca *</Label>
                    <Input
                      id="marca"
                      value={newCustomer.vehiculo_marca || ''}
                      onChange={(e) => setNewCustomer({...newCustomer, vehiculo_marca: e.target.value})}
                      placeholder="Toyota, Ford, Chevrolet..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="modelo">Modelo *</Label>
                    <Input
                      id="modelo"
                      value={newCustomer.vehiculo_modelo || ''}
                      onChange={(e) => setNewCustomer({...newCustomer, vehiculo_modelo: e.target.value})}
                      placeholder="Corolla, Focus, Aveo..."
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="año">Año *</Label>
                    <Input
                      id="año"
                      type="number"
                      min="1990"
                      max="2025"
                      value={newCustomer.vehiculo_año || ''}
                      onChange={(e) => setNewCustomer({...newCustomer, vehiculo_año: e.target.value})}
                      placeholder="2020"
                    />
                  </div>
                  <div>
                    <Label htmlFor="color">Color</Label>
                    <Input
                      id="color"
                      value={newCustomer.vehiculo_color || ''}
                      onChange={(e) => setNewCustomer({...newCustomer, vehiculo_color: e.target.value})}
                      placeholder="Blanco, Negro, Rojo..."
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="problema">Problema Reportado *</Label>
                  <Textarea
                    id="problema"
                    value={newCustomer.problema || ''}
                    onChange={(e) => setNewCustomer({...newCustomer, problema: e.target.value})}
                    placeholder="Describe el problema o servicio requerido..."
                    rows={3}
                  />
                </div>
              </div>

              {/* Información Adicional */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground border-b pb-2">Información Adicional</h3>
                <div>
                  <Label htmlFor="seguimiento">Próximo Seguimiento</Label>
                  <Input
                    id="seguimiento"
                    type="datetime-local"
                    value={newCustomer.proximo_seguimiento}
                    onChange={(e) => setNewCustomer({...newCustomer, proximo_seguimiento: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="notas">Notas Adicionales</Label>
                  <Textarea
                    id="notas"
                    value={newCustomer.notas}
                    onChange={(e) => setNewCustomer({...newCustomer, notas: e.target.value})}
                    placeholder="Información adicional del cliente o vehículo"
                    rows={2}
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowNewCustomer(false)}>
                Cancelar
              </Button>
              <Button onClick={createCustomer}>
                Registrar Cliente
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex space-x-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar por nombre, teléfono o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="individual">Individual</SelectItem>
                <SelectItem value="flotilla">Flotilla</SelectItem>
                <SelectItem value="revendedor">Revendedor</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Clientes */}
      <div className="grid gap-4">
        {filteredCustomers.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No se encontraron clientes</h3>
              <p className="text-muted-foreground">
                {customers.length === 0 
                  ? "Registra tu primer cliente para comenzar" 
                  : "Intenta ajustar los filtros de búsqueda"
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredCustomers.map((customer) => (
            <Card key={customer.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{customer.nombre}</CardTitle>
                    <CardDescription className="flex items-center space-x-4 mt-1">
                      <span className="flex items-center">
                        <Phone className="h-3 w-3 mr-1" />
                        {customer.telefono}
                      </span>
                      {customer.email && (
                        <span className="flex items-center">
                          <Mail className="h-3 w-3 mr-1" />
                          {customer.email}
                        </span>
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getTypeBadge(customer.tipo_cliente)}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <DollarSign className="h-4 w-4 text-green-600 mr-1" />
                      <span className="text-sm font-medium">Valor Total</span>
                    </div>
                    <p className="text-lg font-bold text-green-600">
                      ${customer.valor_total.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <Wrench className="h-4 w-4 text-blue-600 mr-1" />
                      <span className="text-sm font-medium">Trabajos</span>
                    </div>
                    <p className="text-lg font-bold text-blue-600">
                      {customer.trabajos_realizados}
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <Calendar className="h-4 w-4 text-purple-600 mr-1" />
                      <span className="text-sm font-medium">Registro</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(customer.fecha_registro).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <Calendar className="h-4 w-4 text-orange-600 mr-1" />
                      <span className="text-sm font-medium">Último Contacto</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {customer.ultimo_contacto 
                        ? new Date(customer.ultimo_contacto).toLocaleDateString()
                        : 'Nunca'
                      }
                    </p>
                  </div>
                </div>

                {customer.notas && (
                  <div className="bg-slate-light p-3 rounded-lg mb-4">
                    <p className="text-sm text-slate">{customer.notas}</p>
                  </div>
                )}

                {customer.proximo_seguimiento && (
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-sm text-muted-foreground">
                      Próximo seguimiento: {new Date(customer.proximo_seguimiento).toLocaleString()}
                    </span>
                    <Button size="sm" variant="outline">
                      <Calendar className="h-4 w-4 mr-1" />
                      Contactar
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default CustomersPage;
