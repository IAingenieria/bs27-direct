import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Car, 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  FileText, 
  Wrench, 
  Clock,
  CheckCircle,
  AlertTriangle,
  Edit
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface VehicleDetails {
  id: string;
  folio: string;
  marca: string;
  modelo: string;
  año: string;
  color: string;
  placas: string;
  status_vehiculo: 'recibido' | 'diagnostico' | 'cotizacion_aprobada' | 'en_proceso' | 'listo_entrega' | 'entregado';
  problema_reportado: string;
  diagnostico_tecnico: string;
  trabajo_realizado: string;
  piezas_utilizadas: string;
  costo_estimado: number;
  tiempo_estimado: string;
  prioridad: 'baja' | 'media' | 'alta' | 'urgente';
  notas_adicionales: string;
  fecha_ingreso: string;
  fecha_estimada_entrega: string;
  created_at: string;
  updated_at: string;
  cliente: {
    id: string;
    nombre: string;
    telefono: string;
    email: string;
    tipo_cliente: string;
  };
}

interface StatusPhase {
  key: string;
  label: string;
  icon: string;
  color: string;
  bgColor: string;
}

export function VehicleDetailsPage() {
  const { vehicleId } = useParams<{ vehicleId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [vehicle, setVehicle] = useState<VehicleDetails | null>(null);
  const [loading, setLoading] = useState(true);

  // Function to parse FOLIO information from notas
  const parseVehicleInfo = (notas: string) => {
    const info = {
      folio: '',
      placas: '',
      color: '',
      marca: '',
      modelo: '',
      año: '',
      problema: ''
    };

    if (!notas) return info;

    // Parse FOLIO
    const folioMatch = notas.match(/FOLIO:\s*([^\n]+)/i);
    if (folioMatch) info.folio = folioMatch[1].trim();

    // Parse Placas
    const placasMatch = notas.match(/Placas:\s*([^\n]+)/i);
    if (placasMatch) info.placas = placasMatch[1].trim();

    // Parse Color
    const colorMatch = notas.match(/Color:\s*([^\n]+)/i);
    if (colorMatch) info.color = colorMatch[1].trim();

    // Parse Problema
    const problemaMatch = notas.match(/Problema:\s*([^\n]+)/i);
    if (problemaMatch) info.problema = problemaMatch[1].trim();

    // Try to extract marca/modelo from vehiculo field or notas
    const vehiculoMatch = notas.match(/Vehículo:\s*([^\n]+)/i);
    if (vehiculoMatch) {
      const vehiculoText = vehiculoMatch[1].trim();
      const parts = vehiculoText.split(' ');
      if (parts.length >= 2) {
        info.marca = parts[0];
        info.modelo = parts.slice(1).join(' ');
      }
    }

    return info;
  };

  // Fases del proceso con iconos y colores
  const statusPhases: StatusPhase[] = [
    { key: 'recibido', label: 'Recibido', icon: '📥', color: 'text-blue-600', bgColor: 'bg-blue-50 border-blue-200' },
    { key: 'diagnostico', label: 'Diagnóstico', icon: '🔍', color: 'text-purple-600', bgColor: 'bg-purple-50 border-purple-200' },
    { key: 'cotizacion_aprobada', label: 'Cotización Aprobada', icon: '✅', color: 'text-green-600', bgColor: 'bg-green-50 border-green-200' },
    { key: 'en_proceso', label: 'En Proceso', icon: '🔧', color: 'text-orange-600', bgColor: 'bg-orange-50 border-orange-200' },
    { key: 'listo_entrega', label: 'Listo para Entrega', icon: '✅', color: 'text-emerald-600', bgColor: 'bg-emerald-50 border-emerald-200' },
    { key: 'entregado', label: 'Entregado', icon: '🚚', color: 'text-gray-600', bgColor: 'bg-gray-50 border-gray-200' }
  ];

  useEffect(() => {
    if (vehicleId) {
      fetchVehicleDetails();
    }
  }, [vehicleId]);

  const fetchVehicleDetails = async () => {
    try {
      console.log('Fetching vehicle details for ID:', vehicleId);
      
      const { data, error } = await supabase
        .from('vehiculos')
        .select(`
          *,
          clientes (
            id,
            nombre,
            telefono,
            email,
            tipo_cliente
          )
        `)
        .eq('id', vehicleId)
        .single();

      console.log('Vehicle data received:', data);
      console.log('Error:', error);

      if (error) throw error;

      if (data) {
        const vehicleData = {
          id: data.id,
          folio: data.folio || 'Sin FOLIO',
          marca: data.marca || 'No especificado',
          modelo: data.modelo || 'No especificado',
          año: data.año || 'No especificado',
          color: data.color || 'No especificado',
          placas: data.placas || '',
          status_vehiculo: data.status_vehiculo || 'recibido',
          problema_reportado: data.problema_reportado || '',
          diagnostico_tecnico: data.diagnostico_tecnico || '',
          trabajo_realizado: data.trabajo_realizado || '',
          piezas_utilizadas: data.piezas_utilizadas || '',
          costo_estimado: data.costo_estimado || 0,
          tiempo_estimado: data.tiempo_estimado || '',
          prioridad: data.prioridad || 'media',
          notas_adicionales: data.notas_adicionales || '',
          fecha_ingreso: data.fecha_ingreso || data.created_at,
          fecha_estimada_entrega: data.fecha_estimada_entrega || '',
          created_at: data.created_at,
          updated_at: data.updated_at,
          cliente: {
            id: data.clientes?.id || '',
            nombre: data.clientes?.nombre || 'Cliente desconocido',
            telefono: data.clientes?.telefono || '',
            email: data.clientes?.email || '',
            tipo_cliente: data.clientes?.tipo_cliente || 'particular'
          }
        };
        
        console.log('Processed vehicle data:', vehicleData);
        setVehicle(vehicleData);
      }
    } catch (error) {
      console.error('Error fetching vehicle details:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los detalles del vehículo",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'recibido':
        return {
          label: 'Recibido',
          color: 'bg-blue-100 text-blue-800 border border-blue-200',
          icon: Car
        };
      case 'en_proceso':
        return {
          label: 'En Proceso',
          color: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
          icon: Wrench
        };
      case 'completado':
        return {
          label: 'Completado',
          color: 'bg-green-100 text-green-800 border border-green-200',
          icon: CheckCircle
        };
      case 'entregado':
        return {
          label: 'Entregado',
          color: 'bg-gray-100 text-gray-800 border border-gray-200',
          icon: CheckCircle
        };
      default:
        return {
          label: 'Desconocido',
          color: 'bg-gray-100 text-gray-800 border border-gray-200',
          icon: Clock
        };
    }
  };

  // Función para actualizar el estado del vehículo
  const updateVehicleStatus = async (newStatus: string) => {
    if (!vehicle) return;

    try {
      const { error } = await supabase
        .from('ordenes_taller')
        .update({ status: newStatus })
        .eq('id', vehicle.id);

      if (error) throw error;

      // Actualizar el estado local
      setVehicle(prev => prev ? { ...prev, status_vehiculo: newStatus as any } : null);

      const statusLabel = statusPhases.find(p => p.key === newStatus)?.label || newStatus;
      toast({
        title: "Estado actualizado",
        description: `El vehículo ha sido marcado como ${statusLabel}`,
      });

      // Si el vehículo fue marcado como entregado, regresar a la lista después de un breve delay
      if (newStatus === 'entregado') {
        setTimeout(() => {
          navigate('/vehiculos');
        }, 2000);
      }
    } catch (error) {
      console.error('Error updating vehicle status:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado",
        variant: "destructive",
      });
    }
  };

  // Renderizar barra de progreso con fases
  const renderProgressBar = () => {
    if (!vehicle) return null;

    const currentPhaseIndex = statusPhases.findIndex(phase => phase.key === vehicle.status_vehiculo);
    
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-center">Progreso del Vehículo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm text-gray-500">
              <span>Estado actual: {statusPhases[currentPhaseIndex]?.label || 'Desconocido'}</span>
              <span>{Math.round(((currentPhaseIndex + 1) / statusPhases.length) * 100)}%</span>
            </div>
            
            <div className="flex items-center space-x-2">
              {statusPhases.map((phase, index) => {
                const isCompleted = index <= currentPhaseIndex;
                const isCurrent = index === currentPhaseIndex;
                
                return (
                  <div key={phase.key} className="flex items-center flex-1">
                    <button
                      onClick={() => updateVehicleStatus(phase.key)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all hover:scale-105 ${
                        isCompleted 
                          ? 'bg-green-500 text-white shadow-lg' 
                          : isCurrent 
                          ? 'bg-blue-500 text-white animate-pulse shadow-lg'
                          : 'bg-gray-200 text-gray-400 hover:bg-gray-300'
                      }`}
                      title={`${phase.label} - Click para cambiar estado`}
                    >
                      {phase.icon}
                    </button>
                    {index < statusPhases.length - 1 && (
                      <div className={`flex-1 h-2 mx-2 rounded-full ${
                        isCompleted ? 'bg-green-500' : 'bg-gray-200'
                      }`} />
                    )}
                  </div>
                );
              })}
            </div>
            
            <div className="text-center">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                statusPhases[currentPhaseIndex]?.bgColor || 'bg-gray-50 border-gray-200'
              } border`}>
                {statusPhases[currentPhaseIndex]?.icon} {statusPhases[currentPhaseIndex]?.label}
              </span>
            </div>

            {/* Fechas de progreso */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs text-gray-600 mt-4">
              <div>
                <span className="font-medium">Fecha Ingreso:</span>
                <br />
                {vehicle.fecha_ingreso ? new Date(vehicle.fecha_ingreso).toLocaleDateString() : 'N/A'}
              </div>
              {vehicle.fecha_estimada_entrega && (
                <div>
                  <span className="font-medium">Entrega Estimada:</span>
                  <br />
                  {new Date(vehicle.fecha_estimada_entrega).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case 'urgente':
        return {
          label: 'Urgente',
          color: 'bg-red-100 text-red-800 border border-red-200',
          icon: AlertTriangle
        };
      case 'alta':
        return {
          label: 'Alta',
          color: 'bg-orange-100 text-orange-800 border border-orange-200',
          icon: AlertTriangle
        };
      case 'media':
        return {
          label: 'Media',
          color: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
          icon: Clock
        };
      case 'baja':
        return {
          label: 'Baja',
          color: 'bg-green-100 text-green-800 border border-green-200',
          icon: Clock
        };
      default:
        return {
          label: 'Media',
          color: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
          icon: Clock
        };
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateDaysInShop = () => {
    const ingressDate = new Date(vehicle?.fecha_ingreso || vehicle?.created_at || '');
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - ingressDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Cargando detalles del vehículo...</p>
        </div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">
          <p className="text-muted-foreground">No se encontró el vehículo con ID: {vehicleId}</p>
          <p className="text-sm text-muted-foreground mt-2">
            Verifica que el vehículo existe en la base de datos
          </p>
          <Button onClick={() => navigate(-1)} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(vehicle.status_vehiculo);
  const priorityConfig = getPriorityConfig(vehicle.prioridad);
  const StatusIcon = statusConfig.icon;
  const PriorityIcon = priorityConfig.icon;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{(() => {
              const info = parseVehicleInfo(vehicle.notas || '');
              const marca = info.marca || vehicle.vehiculo?.split(' ')[0] || 'Vehículo';
              const modelo = info.modelo || vehicle.vehiculo?.split(' ').slice(1).join(' ') || 'Sin especificar';
              return `${marca} ${modelo}`;
            })()}</h1>
            <p className="text-muted-foreground">FOLIO: {(() => {
              const info = parseVehicleInfo(vehicle.notas || '');
              return info.folio || vehicle.id || 'Sin FOLIO';
            })()}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={statusConfig.color}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {statusConfig.label}
          </Badge>
          <Badge className={priorityConfig.color}>
            <PriorityIcon className="h-3 w-3 mr-1" />
            {priorityConfig.label}
          </Badge>
        </div>
      </div>

      {/* Progreso del Vehículo */}
      {renderProgressBar()}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Información del Cliente */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Información del Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="font-medium">{vehicle.cliente.nombre}</p>
              <Badge variant="outline" className="text-xs mt-1">
                {vehicle.cliente.tipo_cliente}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{vehicle.cliente.telefono}</span>
            </div>
            {vehicle.cliente.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{vehicle.cliente.email}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Detalles del Vehículo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              Detalles del Vehículo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-muted-foreground">FOLIO</p>
                <p className="font-medium font-mono">{(() => {
                  const info = parseVehicleInfo(vehicle.notas || '');
                  return info.folio || vehicle.id || 'Sin FOLIO';
                })()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Placas</p>
                <p className="font-medium">{(() => {
                  const info = parseVehicleInfo(vehicle.notas || '');
                  return info.placas || 'No especificado';
                })()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Marca</p>
                <p className="font-medium">{(() => {
                  const info = parseVehicleInfo(vehicle.notas || '');
                  return info.marca || vehicle.vehiculo?.split(' ')[0] || 'No especificado';
                })()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Modelo</p>
                <p className="font-medium">{(() => {
                  const info = parseVehicleInfo(vehicle.notas || '');
                  return info.modelo || vehicle.vehiculo?.split(' ').slice(1).join(' ') || 'No especificado';
                })()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Año</p>
                <p className="font-medium">{(() => {
                  const info = parseVehicleInfo(vehicle.notas || '');
                  return info.año || 'No especificado';
                })()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Color</p>
                <p className="font-medium">{(() => {
                  const info = parseVehicleInfo(vehicle.notas || '');
                  return info.color || 'No especificado';
                })()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fechas y Tiempo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Fechas y Tiempo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-muted-foreground text-sm">Fecha de Ingreso</p>
              <p className="font-medium">{new Date(vehicle.created_at).toLocaleDateString('es-MX', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Días en Taller</p>
              <p className="font-medium">{Math.floor((new Date().getTime() - new Date(vehicle.created_at).getTime()) / (1000 * 60 * 60 * 24))} días</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Información Técnica */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Problema y Diagnóstico */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Problema y Diagnóstico
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-medium text-sm mb-2">Problema Reportado</p>
              <p className="text-sm bg-muted p-3 rounded">
                {vehicle.notas || vehicle.problema_reportado || 'No especificado'}
              </p>
            </div>
            {vehicle.diagnostico_tecnico && (
              <div>
                <p className="font-medium text-sm mb-2">Diagnóstico Técnico</p>
                <p className="text-sm bg-muted p-3 rounded">
                  {vehicle.diagnostico_tecnico}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Trabajo y Piezas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Trabajo Realizado
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {vehicle.trabajo_realizado && (
              <div>
                <p className="font-medium text-sm mb-2">Trabajo Realizado</p>
                <p className="text-sm bg-muted p-3 rounded">
                  {vehicle.trabajo_realizado}
                </p>
              </div>
            )}
            {vehicle.piezas_utilizadas && (
              <div>
                <p className="font-medium text-sm mb-2">Piezas Utilizadas</p>
                <p className="text-sm bg-muted p-3 rounded">
                  {vehicle.piezas_utilizadas}
                </p>
              </div>
            )}
            {vehicle.costo_estimado > 0 && (
              <div>
                <p className="font-medium text-sm mb-2">Costo Estimado</p>
                <p className="text-lg font-bold text-primary">
                  ${vehicle.costo_estimado.toLocaleString('es-MX')}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Notas Adicionales */}
      {vehicle.notas_adicionales && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Notas Adicionales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm bg-muted p-4 rounded">
              {vehicle.notas_adicionales}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Acciones */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2 justify-end">
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Editar Información
            </Button>
            <Button>
              Actualizar Estado
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
