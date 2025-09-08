import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Car, Clock, CheckCircle, AlertTriangle, MessageSquare } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface Vehicle {
  id: string;
  folio: string;
  client: string;
  vehicle: string;
  status: 'recibido' | 'en_proceso' | 'completado' | 'entregado';
  days: number;
  created_at: string;
  problema_reportado: string;
}

export function VehicleStatus() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      const { data, error } = await supabase
        .from('vehiculos')
        .select(`
          id,
          folio,
          marca,
          modelo,
          status_vehiculo,
          problema_reportado,
          created_at,
          clientes (
            nombre
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const processedVehicles: Vehicle[] = (data || []).map((vehicle: any) => {
        const createdDate = new Date(vehicle.created_at);
        const today = new Date();
        const daysDiff = Math.floor((today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
        
        return {
          id: vehicle.id,
          folio: vehicle.folio || 'Sin FOLIO',
          client: vehicle.clientes?.nombre || 'Cliente desconocido',
          vehicle: `${vehicle.marca || ''} ${vehicle.modelo || ''}`.trim() || 'Vehículo sin datos',
          status: vehicle.status_vehiculo || 'en_proceso',
          days: daysDiff,
          created_at: vehicle.created_at,
          problema_reportado: vehicle.problema_reportado || ''
        };
      });

      setVehicles(processedVehicles);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status: Vehicle['status'], days: number) => {
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
          icon: Clock
        };
      case 'completado':
        return {
          label: days > 3 ? 'Urgente Entrega' : 'Listo',
          color: days > 3 ? 'bg-red-100 text-red-800 border border-red-200' : 'bg-green-100 text-green-800 border border-green-200',
          icon: days > 3 ? AlertTriangle : CheckCircle
        };
      case 'entregado':
        return {
          label: 'Entregado',
          color: 'bg-gray-100 text-gray-800 border border-gray-200',
          icon: CheckCircle
        };
      default:
        return {
          label: 'En Proceso',
          color: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
          icon: Clock
        };
    }
  };

  // Filtrar vehículos recibidos hoy
  const today = new Date().toDateString();
  const receivedToday = vehicles.filter(v => {
    const vehicleDate = new Date(v.created_at).toDateString();
    return vehicleDate === today;
  });

  const groupedVehicles = {
    recibido: receivedToday, // Solo vehículos de hoy
    en_proceso: vehicles.filter(v => v.status === 'en_proceso'),
    completado: vehicles.filter(v => v.status === 'completado')
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Car className="h-4 w-4 text-primary" />
            Estado de Vehículos
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-center py-8 text-muted-foreground">
            Cargando vehículos...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Car className="h-4 w-4 text-primary" />
          Estado de Vehículos
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-3 gap-4">
          {Object.entries(groupedVehicles).map(([status, vehicleList]) => {
            const statusConfig = getStatusConfig(status as Vehicle['status'], 0);
            
            return (
              <div key={status} className="border rounded-lg p-3 min-h-[200px]">
                <div className="flex items-center gap-2 mb-3 border-b pb-2">
                  <statusConfig.icon className="h-4 w-4" />
                  <h4 className="font-medium text-sm">{statusConfig.label}</h4>
                  <Badge variant="outline" className="text-xs ml-auto">{vehicleList.length}</Badge>
                </div>
                
                <div className="space-y-2">
                  {vehicleList.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground text-xs">
                      {status === 'recibido' ? 'No hay vehículos recibidos hoy' : 
                       status === 'en_proceso' ? 'No hay vehículos en proceso' : 
                       'No hay vehículos listos'}
                    </div>
                  ) : (
                    vehicleList.map((vehicle) => {
                      const config = getStatusConfig(vehicle.status, vehicle.days);
                      const isUrgent = vehicle.days > 3 && vehicle.status === 'completado';
                      
                      return (
                        <div 
                          key={vehicle.id} 
                          className="p-2 rounded border border-border/50 hover:bg-muted/30 transition-colors cursor-pointer"
                          onClick={() => navigate(`/vehiculos/${vehicle.id}`)}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <Badge className={`${config.color} text-xs`}>
                              <config.icon className="h-2 w-2 mr-1" />
                              {config.label}
                            </Badge>
                            {isUrgent && (
                              <Badge variant="destructive" className="animate-pulse text-xs">
                                Urgente
                              </Badge>
                            )}
                          </div>
                          
                          <div className="mb-1">
                            <p className="font-medium text-xs">{vehicle.client}</p>
                            <p className="text-xs text-muted-foreground truncate">{vehicle.vehicle}</p>
                            <p className="text-xs text-muted-foreground truncate">FOLIO: {vehicle.folio}</p>
                          </div>
                          
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground truncate">
                              {vehicle.problema_reportado || 'Sin descripción'}
                            </span>
                            <span className="text-muted-foreground">
                              {vehicle.days} día{vehicle.days !== 1 ? 's' : ''}
                            </span>
                          </div>
                          
                          {vehicle.status === 'completado' && (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="w-full mt-1 h-6 text-xs"
                            >
                              <MessageSquare className="h-2 w-2 mr-1" />
                              Notificar Cliente
                            </Button>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}