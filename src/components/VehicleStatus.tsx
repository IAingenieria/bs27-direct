import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Car, Clock, CheckCircle, AlertTriangle, MessageSquare } from "lucide-react";

interface Vehicle {
  id: string;
  client: string;
  vehicle: string;
  status: 'received' | 'in-progress' | 'ready';
  days: number;
  amount: string;
  urgent?: boolean;
}

export function VehicleStatus() {
  const vehicles: Vehicle[] = [
    {
      id: "1",
      client: "María González",
      vehicle: "Honda Civic 2020",
      status: "ready",
      days: 5,
      amount: "$4,500",
      urgent: true
    },
    {
      id: "2",
      client: "Carlos Ruiz",
      vehicle: "Nissan Sentra 2019",
      status: "in-progress",
      days: 2,
      amount: "$6,200"
    },
    {
      id: "3",
      client: "Ana López",
      vehicle: "Toyota Corolla 2021",
      status: "received",
      days: 1,
      amount: "$8,200"
    },
    {
      id: "4",
      client: "Roberto Silva",
      vehicle: "Ford Focus 2018",
      status: "ready",
      days: 4,
      amount: "$3,800",
      urgent: true
    }
  ];

  const getStatusConfig = (status: Vehicle['status'], days: number) => {
    switch (status) {
      case 'received':
        return {
          label: 'Recibido',
          color: 'bg-muted text-muted-foreground',
          icon: Car
        };
      case 'in-progress':
        return {
          label: 'En Proceso',
          color: 'bg-warning/10 text-warning',
          icon: Clock
        };
      case 'ready':
        return {
          label: days > 3 ? 'Urgente Entrega' : 'Listo',
          color: days > 3 ? 'bg-destructive/10 text-destructive' : 'bg-success/10 text-success',
          icon: days > 3 ? AlertTriangle : CheckCircle
        };
      default:
        return {
          label: 'Desconocido',
          color: 'bg-muted text-muted-foreground',
          icon: Car
        };
    }
  };

  const groupedVehicles = {
    received: vehicles.filter(v => v.status === 'received'),
    'in-progress': vehicles.filter(v => v.status === 'in-progress'),
    ready: vehicles.filter(v => v.status === 'ready')
  };

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
                  {vehicleList.map((vehicle) => {
                    const config = getStatusConfig(vehicle.status, vehicle.days);
                    
                    return (
                      <div 
                        key={vehicle.id} 
                        className="p-2 rounded border border-border/50 hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <Badge className={`${config.color} text-xs`}>
                            <config.icon className="h-2 w-2 mr-1" />
                            {config.label}
                          </Badge>
                          {vehicle.urgent && (
                            <Badge variant="destructive" className="animate-pulse text-xs">
                              Urgente
                            </Badge>
                          )}
                        </div>
                        
                        <div className="mb-1">
                          <p className="font-medium text-xs">{vehicle.client}</p>
                          <p className="text-xs text-muted-foreground truncate">{vehicle.vehicle}</p>
                        </div>
                        
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium">{vehicle.amount}</span>
                          <span className="text-muted-foreground">
                            {vehicle.days} día{vehicle.days !== 1 ? 's' : ''}
                          </span>
                        </div>
                        
                        {vehicle.status === 'ready' && (
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
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}