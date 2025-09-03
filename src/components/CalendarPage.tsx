import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Phone, User, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ScheduleItem {
  id: string;
  type: 'seguimiento' | 'vencimiento' | 'contacto';
  title: string;
  description: string;
  date: string;
  client: string;
  phone: string;
  urgent: boolean;
}

const CalendarPage = () => {
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchScheduleData();
  }, []);

  const fetchScheduleData = async () => {
    try {
      const today = new Date();
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      // Obtener seguimientos programados
      const { data: seguimientos, error: seguimientosError } = await supabase
        .from('clientes')
        .select('id, nombre, telefono, proximo_seguimiento')
        .not('proximo_seguimiento', 'is', null)
        .gte('proximo_seguimiento', today.toISOString())
        .lte('proximo_seguimiento', nextWeek.toISOString());

      if (seguimientosError) throw seguimientosError;

      // Obtener cotizaciones que vencen
      const { data: cotizaciones, error: cotizacionesError } = await supabase
        .from('cotizaciones')
        .select(`
          id, vehiculo, fecha_vencimiento,
          clientes (nombre, telefono)
        `)
        .not('fecha_vencimiento', 'is', null)
        .gte('fecha_vencimiento', today.toISOString())
        .lte('fecha_vencimiento', nextWeek.toISOString())
        .in('status', ['pendiente', 'en_proceso', 'enviada']);

      if (cotizacionesError) throw cotizacionesError;

      // Obtener pagos que vencen
      const { data: pagos, error: pagosError } = await supabase
        .from('pagos')
        .select(`
          id, monto_pendiente, fecha_vencimiento,
          cotizaciones (
            vehiculo,
            clientes (nombre, telefono)
          )
        `)
        .not('fecha_vencimiento', 'is', null)
        .gte('fecha_vencimiento', today.toISOString())
        .lte('fecha_vencimiento', nextWeek.toISOString())
        .eq('pagado', false);

      if (pagosError) throw pagosError;

      // Combinar todos los eventos
      const items: ScheduleItem[] = [];

      // Agregar seguimientos
      seguimientos?.forEach(cliente => {
        if (cliente.proximo_seguimiento) {
          items.push({
            id: `seguimiento-${cliente.id}`,
            type: 'seguimiento',
            title: 'Seguimiento de Cliente',
            description: `Contactar a ${cliente.nombre}`,
            date: cliente.proximo_seguimiento,
            client: cliente.nombre,
            phone: cliente.telefono,
            urgent: false
          });
        }
      });

      // Agregar vencimientos de cotizaciones
      cotizaciones?.forEach(cotizacion => {
        if (cotizacion.fecha_vencimiento) {
          items.push({
            id: `cotizacion-${cotizacion.id}`,
            type: 'vencimiento',
            title: 'Vencimiento de Cotización',
            description: `${cotizacion.vehiculo} - ${cotizacion.clientes.nombre}`,
            date: cotizacion.fecha_vencimiento,
            client: cotizacion.clientes.nombre,
            phone: cotizacion.clientes.telefono,
            urgent: true
          });
        }
      });

      // Agregar vencimientos de pagos
      pagos?.forEach(pago => {
        if (pago.fecha_vencimiento && pago.cotizaciones) {
          items.push({
            id: `pago-${pago.id}`,
            type: 'vencimiento',
            title: 'Vencimiento de Pago',
            description: `$${pago.monto_pendiente.toLocaleString()} - ${pago.cotizaciones.vehiculo}`,
            date: pago.fecha_vencimiento,
            client: pago.cotizaciones.clientes.nombre,
            phone: pago.cotizaciones.clientes.telefono,
            urgent: true
          });
        }
      });

      // Ordenar por fecha
      items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      setScheduleItems(items);
    } catch (error) {
      console.error('Error fetching schedule data:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los eventos de la agenda",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'seguimiento': return <User className="h-4 w-4" />;
      case 'vencimiento': return <AlertTriangle className="h-4 w-4" />;
      case 'contacto': return <Phone className="h-4 w-4" />;
      default: return <Calendar className="h-4 w-4" />;
    }
  };

  const getTypeBadge = (type: string, urgent: boolean) => {
    if (urgent) {
      return (
        <Badge variant="destructive" className="text-xs">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Urgente
        </Badge>
      );
    }

    const variants = {
      seguimiento: 'bg-info-light text-info border border-info/20',
      pago: 'bg-success-light text-success border border-success/20',
      entrega: 'bg-purple-light text-purple border border-purple/20',
      cotizacion: 'bg-warning-light text-warning border border-warning/20'
    };

    return (
      <Badge className={variants[type as keyof typeof variants] || 'bg-slate-light text-slate border border-slate/20'}>
        {getTypeIcon(type)}
        <span className="ml-1 capitalize">{type}</span>
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return `Hoy - ${date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return `Mañana - ${date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleString('es-MX', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
  };

  const groupItemsByDate = (items: ScheduleItem[]) => {
    const groups: { [key: string]: ScheduleItem[] } = {};
    
    items.forEach(item => {
      const date = new Date(item.date).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(item);
    });

    return groups;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const groupedItems = groupItemsByDate(scheduleItems);
  const todayItems = scheduleItems.filter(item => {
    const itemDate = new Date(item.date).toDateString();
    const today = new Date().toDateString();
    return itemDate === today;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Agenda y Calendario</h1>
          <p className="text-muted-foreground">
            Sistema de agenda y seguimientos programados
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="text-sm">
            {scheduleItems.length} Eventos esta semana
          </Badge>
          <Badge variant="destructive" className="text-sm">
            {todayItems.length} Para hoy
          </Badge>
        </div>
      </div>

      {/* Eventos de Hoy */}
      {todayItems.length > 0 && (
        <Card className="border-warning/20 bg-warning-light">
          <CardHeader>
            <CardTitle className="flex items-center text-warning">
              <Clock className="mr-2 h-5 w-5" />
              Eventos de Hoy ({todayItems.length})
            </CardTitle>
            <CardDescription className="text-orange-700">
              Actividades programadas para hoy que requieren atención
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {todayItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 bg-white rounded-lg border border-warning/20"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    {getTypeBadge(item.type, item.urgent)}
                    <span className="text-sm font-medium">{formatDate(item.date)}</span>
                  </div>
                  <h4 className="font-semibold">{item.title}</h4>
                  <p className="text-sm text-gray-600">{item.description}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Cliente: {item.client} • Tel: {item.phone}
                  </p>
                </div>
                <Button size="sm" variant="outline">
                  <Phone className="h-4 w-4 mr-1" />
                  Contactar
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Agenda Semanal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="mr-2 h-5 w-5" />
            Agenda de la Semana
          </CardTitle>
          <CardDescription>
            Todos los eventos programados para los próximos 7 días
          </CardDescription>
        </CardHeader>
        <CardContent>
          {scheduleItems.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay eventos programados</h3>
              <p className="text-muted-foreground">
                Los seguimientos y vencimientos aparecerán aquí automáticamente
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedItems).map(([dateString, items]) => {
                const date = new Date(dateString);
                const isToday = date.toDateString() === new Date().toDateString();
                
                return (
                  <div key={dateString} className={`${isToday ? 'opacity-50' : ''}`}>
                    <h3 className="text-lg font-semibold mb-3 text-gray-700">
                      {date.toLocaleDateString('es-MX', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </h3>
                    <div className="space-y-3 ml-4">
                      {items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                        >
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              {getTypeBadge(item.type, item.urgent)}
                              <span className="text-sm font-medium">
                                {new Date(item.date).toLocaleTimeString('es-MX', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </span>
                            </div>
                            <h4 className="font-semibold">{item.title}</h4>
                            <p className="text-sm text-gray-600">{item.description}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              Cliente: {item.client} • Tel: {item.phone}
                            </p>
                          </div>
                          <Button size="sm" variant="outline">
                            <Phone className="h-4 w-4 mr-1" />
                            Contactar
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CalendarPage;
