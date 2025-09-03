import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Activity, 
  MessageSquare, 
  DollarSign, 
  Car, 
  User, 
  Clock,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { useState, useEffect } from "react";
import { whatsappMonitor, WhatsAppActivity } from "@/integrations/external-supabase/whatsapp-monitor";

interface ActivityItem {
  id: string;
  type: 'whatsapp';
  client: string;
  phone: string;
  email: string;
  vehicle: {
    brand: string;
    model: string;
    year: string;
  };
  sessionId: string;
}

export function RecentActivity() {
  const [whatsappActivities, setWhatsappActivities] = useState<WhatsAppActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWhatsAppActivities = async () => {
      try {
        console.log('Fetching WhatsApp activities...');
        const activities = await whatsappMonitor.getWhatsAppActivities(10);
        console.log('WhatsApp activities fetched:', activities);
        setWhatsappActivities(activities);
      } catch (error) {
        console.error('Error fetching WhatsApp activities:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWhatsAppActivities();
    
    // Actualizar cada 30 segundos
    const interval = setInterval(fetchWhatsAppActivities, 30000);
    return () => clearInterval(interval);
  }, []);

  // Solo mostrar actividades reales de WhatsApp
  const allActivities: ActivityItem[] = whatsappActivities.map(wa => ({
    id: wa.id,
    type: wa.type,
    client: wa.client,
    phone: wa.phone,
    email: wa.email,
    vehicle: wa.vehicle,
    sessionId: wa.sessionId
  })).slice(0, 10); // Mostrar hasta 10

  const getIcon = () => {
    return MessageSquare; // Solo WhatsApp
  };

  return (
    <Card className="relative overflow-hidden transition-all duration-300 hover:shadow-card-hover">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Activity className="h-4 w-4 text-primary" />
          Actividad Reciente
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {loading ? (
            <div className="text-center py-4 text-muted-foreground text-xs">
              Cargando conversaciones de WhatsApp...
            </div>
          ) : allActivities.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground text-xs">
              No hay conversaciones de WhatsApp recientes
            </div>
          ) : (
            allActivities.map((activity) => {
              const Icon = getIcon();
              
              return (
                <div key={activity.id} className="flex items-start space-x-2 p-2 rounded border border-border/50 hover:bg-muted/30 transition-colors">
                  <div className="flex-shrink-0">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                      <Icon className="h-3 w-3 text-primary" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-foreground truncate">
                        {activity.client}
                      </p>
                      <span className="text-xs text-muted-foreground">
                        WhatsApp
                      </span>
                    </div>
                    
                    <div className="mt-1 space-y-1">
                      <div className="flex items-center text-xs text-muted-foreground">
                        <MessageSquare className="h-2 w-2 mr-1" />
                        <span className="truncate">{activity.phone}</span>
                      </div>
                      
                      {activity.email && (
                        <div className="flex items-center text-xs text-muted-foreground">
                          <User className="h-2 w-2 mr-1" />
                          <span className="truncate">{activity.email}</span>
                        </div>
                      )}
                      
                      {(activity.vehicle.brand || activity.vehicle.model || activity.vehicle.year) && (
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Car className="h-2 w-2 mr-1" />
                          <span className="truncate">{activity.vehicle.brand} {activity.vehicle.model} {activity.vehicle.year}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
        
        <div className="mt-3 pt-3 border-t border-border">
          <Button variant="outline" size="sm" className="w-full h-6 text-xs">
            Ver Toda la Actividad
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}