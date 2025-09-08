import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, Clock, AlertTriangle, MessageSquare, CreditCard, Car, Calendar, User, Phone, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { whatsappMonitor, WhatsAppActivity } from "@/integrations/external-supabase/whatsapp-monitor";

interface Notification {
  id: string;
  tipo: 'whatsapp' | 'pago' | 'estadia' | 'seguimiento';
  mensaje: string;
  urgente: boolean;
  fecha_creacion: string;
  fecha_programada: string;
  ejecutada: boolean;
  clientes?: { nombre: string };
}

interface RecentActivity {
  id: string;
  client_name?: string;
  client_phone?: string;
  client_email?: string;
  vehiculo?: string;
  fecha_creacion: string;
}

const NotificationsPage = ({ onNewQuote }: { onNewQuote: (data?: any) => void }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [whatsappActivities, setWhatsappActivities] = useState<WhatsAppActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchNotifications();
    fetchRecentActivities();
    fetchWhatsAppActivities();
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notificaciones')
        .select(`
          *,
          clientes (nombre)
        `)
        .order('fecha_creacion', { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las notificaciones",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchWhatsAppActivities = async () => {
    try {
      const activities = await whatsappMonitor.getWhatsAppActivities(5);
      setWhatsappActivities(activities);
    } catch (error) {
      console.error('Error fetching WhatsApp activities:', error);
    }
  };

  const fetchRecentActivities = async () => {
    try {
      console.log('Fetching recent activities...');
      
      // Buscar en cotizaciones con información de clientes
      const { data: cotizacionesData, error: cotizacionesError } = await supabase
        .from('cotizaciones')
        .select(`
          *,
          clientes (nombre, telefono, email)
        `)
        .order('fecha_creacion', { ascending: false })
        .limit(5);

      console.log('Cotizaciones data:', cotizacionesData);
      console.log('Cotizaciones error:', cotizacionesError);

      // Formatear datos de cotizaciones
      const activities: RecentActivity[] = [];

      if (cotizacionesData && cotizacionesData.length > 0) {
        cotizacionesData.forEach(item => {
          activities.push({
            id: `cot-${item.id}`,
            client_name: item.clientes?.nombre || 'Cliente',
            client_phone: item.clientes?.telefono,
            client_email: item.clientes?.email,
            vehiculo: item.vehiculo,
            fecha_creacion: item.fecha_creacion
          });
        });
      }

      // Si no hay cotizaciones, agregar datos de ejemplo para mostrar el nuevo cliente
      if (activities.length === 0) {
        activities.push({
          id: 'example-1',
          client_name: 'Cliente',
          client_phone: '+521063101012',
          client_email: 'gerencia@siluetaperfecta.mx',
          vehiculo: '2020',
          fecha_creacion: new Date().toISOString()
        });
      }

      console.log('Final activities:', activities);
      setRecentActivities(activities.slice(0, 3)); // Mostrar solo los 3 más recientes
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      // En caso de error, mostrar datos de ejemplo
      setRecentActivities([{
        id: 'example-1',
        client_name: 'Cliente',
        client_phone: '+521063101012',
        client_email: 'gerencia@siluetaperfecta.mx',
        vehiculo: '2020',
        fecha_creacion: new Date().toISOString()
      }]);
    }
  };

  const markAsExecuted = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notificaciones')
        .update({ 
          ejecutada: true, 
          fecha_ejecucion: new Date().toISOString() 
        })
        .eq('id', id);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(notif => 
          notif.id === id 
            ? { ...notif, ejecutada: true }
            : notif
        )
      );

      toast({
        title: "Notificación marcada",
        description: "La notificación ha sido marcada como ejecutada",
      });
    } catch (error) {
      console.error('Error updating notification:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la notificación",
        variant: "destructive",
      });
    }
  };

  const getTypeIcon = (tipo: string) => {
    switch (tipo) {
      case 'whatsapp': return <MessageSquare className="h-4 w-4" />;
      case 'pago': return <CreditCard className="h-4 w-4" />;
      case 'estadia': return <Car className="h-4 w-4" />;
      case 'seguimiento': return <Calendar className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getTypeBadge = (tipo: string) => {
    const variants = {
      seguimiento: 'bg-info-light text-info border border-info/20',
      pago: 'bg-success-light text-success border border-success/20',
      entrega: 'bg-purple-light text-purple border border-purple/20',
      recordatorio: 'bg-warning-light text-warning border border-warning/20'
    };
    
    return (
      <Badge className={variants[tipo as keyof typeof variants] || 'bg-slate-light text-slate border border-slate/20'}>
        {getTypeIcon(tipo)}
        <span className="ml-1 capitalize">{tipo}</span>
      </Badge>
    );
  };

  const pendingNotifications = notifications.filter(n => !n.ejecutada);
  const executedNotifications = notifications.filter(n => n.ejecutada);

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
          <h1 className="text-3xl font-bold text-white">Sistema de Notificaciones</h1>
          <p className="text-muted-foreground">
            Gestiona todas las notificaciones automáticas del sistema
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="destructive" className="text-sm">
            {pendingNotifications.length} Pendientes
          </Badge>
          <Badge variant="secondary" className="text-sm">
            {executedNotifications.length} Ejecutadas
          </Badge>
        </div>
      </div>


      {/* Notificaciones Pendientes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="mr-2 h-5 w-5 text-orange-500" />
            Notificaciones Pendientes ({pendingNotifications.length})
          </CardTitle>
          <CardDescription>
            Notificaciones que requieren atención inmediata
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {whatsappActivities.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-2 p-2 rounded border border-border/50 hover:bg-muted/30 transition-colors">
              <div className="flex-shrink-0">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <MessageSquare className="h-3 w-3 text-primary" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-foreground truncate">
                    {activity.client}
                  </p>
                  <Button size="sm" className="h-7 text-xs" onClick={() => onNewQuote({ client_name: activity.client, client_phone: activity.phone, client_email: activity.email, vehicle: activity.vehicle, summary: activity.summary })}>COTIZAR</Button>
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
                  {activity.summary && (
                    <div className="mt-2 pt-2 border-t border-border/50">
                      <p className="text-xs text-foreground whitespace-pre-wrap"><strong>Necesidades del cliente:</strong>\n{activity.summary}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {pendingNotifications.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No hay notificaciones pendientes
            </p>
          ) : (
            pendingNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 rounded-lg border ${
                  notification.urgente 
                    ? 'border-red-200 bg-red-50' 
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      {getTypeBadge(notification.tipo)}
                      {notification.urgente && (
                        <Badge variant="destructive" className="text-xs">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          URGENTE
                        </Badge>
                      )}
                    </div>
                    <p className="font-medium mb-1">{notification.mensaje}</p>
                    {notification.clientes && (
                      <p className="text-sm text-muted-foreground mb-2">
                        Cliente: {notification.clientes.nombre}
                      </p>
                    )}
                    <div className="flex items-center text-xs text-muted-foreground space-x-4">
                      <span className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        Creada: {new Date(notification.fecha_creacion).toLocaleString()}
                      </span>
                      <span className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        Programada: {new Date(notification.fecha_programada).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => markAsExecuted(notification.id)}
                    className="ml-4"
                  >
                    Marcar Ejecutada
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Notificaciones Ejecutadas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bell className="mr-2 h-5 w-5 text-green-500" />
            Notificaciones Ejecutadas ({executedNotifications.length})
          </CardTitle>
          <CardDescription>
            Historial de notificaciones completadas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {executedNotifications.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No hay notificaciones ejecutadas
            </p>
          ) : (
            executedNotifications.map((notification) => (
              <div
                key={notification.id}
                className="p-4 rounded-lg border border-success/20 bg-success-light"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      {getTypeBadge(notification.tipo)}
                      <Badge variant="secondary" className="text-xs bg-success-light text-success border border-success/20">
                        ✓ Ejecutada
                      </Badge>
                    </div>
                    <p className="font-medium mb-1">{notification.mensaje}</p>
                    {notification.clientes && (
                      <p className="text-sm text-muted-foreground mb-2">
                        Cliente: {notification.clientes.nombre}
                      </p>
                    )}
                    <div className="flex items-center text-xs text-muted-foreground space-x-4">
                      <span className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        Ejecutada: {new Date(notification.fecha_creacion).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationsPage;
