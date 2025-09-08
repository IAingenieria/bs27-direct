import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, Phone, User, AlertTriangle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import MainLayout from "./MainLayout";

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

  return (
    <MainLayout activeTab="calendar" onTabChange={() => {}}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white">Agenda</h1>
        </div>
        
        <Tabs defaultValue="schedule" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-xs mb-6">
            <TabsTrigger value="schedule">Agendar Cita</TabsTrigger>
            <TabsTrigger value="upcoming">Próximos Eventos</TabsTrigger>
          </TabsList>
        
        <TabsContent value="schedule">
          <Card>
            <CardHeader>
              <CardTitle>Agenda una cita</CardTitle>
              <CardDescription>
                Selecciona un horario disponible para tu cita en el taller
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border">
                <iframe 
                  src="https://cal.com/bs27-garage-clkhzw" 
                  width="100%" 
                  height="700" 
                  className="border-0" 
                  title="Agendar Cita"
                ></iframe>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="upcoming">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Próximos Eventos</h2>
                <p className="text-muted-foreground">
                  Sistema de agenda y seguimientos programados
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className="text-sm">
                  {scheduleItems.length} Eventos esta semana
                </Badge>
                <Badge variant="destructive" className="text-sm">
                  {scheduleItems.filter(item => new Date(item.date).toDateString() === new Date().toDateString()).length} Para hoy
                </Badge>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : scheduleItems.length > 0 ? (
              <div className="space-y-6">
                {Object.entries(groupItemsByDate(scheduleItems)).map(([dateString, items]) => {
                  const date = new Date(dateString);
                  const isToday = date.toDateString() === new Date().toDateString();
                  
                  return (
                    <div key={dateString} className={isToday ? 'opacity-50' : ''}>
                      <h3 className="text-lg font-semibold mb-3 text-gray-700">
                        {date.toLocaleDateString('es-MX', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </h3>
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {items.map((item) => (
                          <Card key={item.id} className={item.urgent ? 'border-red-200 bg-red-50' : ''}>
                            <CardHeader className="pb-2">
                              <div className="flex items-center justify-between">
                                <CardTitle className="text-lg flex items-center gap-2">
                                  {item.type === 'seguimiento' && <User className="h-5 w-5" />}
                                  {item.type === 'vencimiento' && <AlertTriangle className="h-5 w-5 text-amber-600" />}
                                  {item.type === 'contacto' && <Phone className="h-5 w-5 text-blue-600" />}
                                  {item.title}
                                </CardTitle>
                                {item.urgent && (
                                  <Badge variant="destructive" className="animate-pulse">
                                    Urgente
                                  </Badge>
                                )}
                              </div>
                            </CardHeader>
                            <CardContent>
                              <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                              <div className="flex items-center text-sm text-muted-foreground">
                                <Calendar className="mr-1 h-4 w-4" />
                                {new Date(item.date).toLocaleDateString()}
                                <Clock className="ml-4 mr-1 h-4 w-4" />
                                {new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                              <div className="mt-2 flex items-center text-sm">
                                <User className="mr-2 h-4 w-4" />
                                {item.client}
                              </div>
                              <div className="mt-2">
                                <a
                                  href={`tel:${item.phone}`}
                                  className="inline-flex items-center text-sm text-blue-600 hover:underline"
                                >
                                  <Phone className="mr-1 h-4 w-4" />
                                  {item.phone}
                                </a>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No hay eventos programados para los próximos días.</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
      </div>
    </MainLayout>
  );
};

export default CalendarPage;
