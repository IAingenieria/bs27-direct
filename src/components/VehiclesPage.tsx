import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Car, Plus, Clock, CheckCircle, AlertTriangle, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Vehicle {
  id: string;
  folio: string;
  cliente_id: string;
  cotizacion_id?: string;
  vehiculo_marca: string;
  vehiculo_modelo: string;
  vehiculo_año?: number;
  vehiculo_placas: string;
  vehiculo_color?: string;
  problema_reportado: string;
  notas?: string;
  status: 'recibido' | 'diagnostico' | 'cotizacion_aprobada' | 'en_proceso' | 'listo_entrega' | 'entregado';
  created_at: string;
  fecha_recibido?: string;
  fecha_diagnostico?: string;
  fecha_cotizacion_aprobada?: string;
  fecha_en_proceso?: string;
  fecha_listo_entrega?: string;
  fecha_entregado?: string;
  dias_estadia_cargo?: number;
  monto_cargo_estadia?: number;
  clientes: { nombre: string; telefono: string; email?: string };
  cotizaciones?: { precio: number; descripcion_trabajo: string };
}

interface Client {
  id: string;
  nombre: string;
  telefono: string;
}

interface Quote {
  id: string;
  vehiculo: string;
  precio: number;
  created_at: string;
  descripcion_trabajo?: string;
}

interface StatusPhase {
  key: string;
  label: string;
  icon: string;
  color: string;
  bgColor: string;
}

const VehiclesPage = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewVehicle, setShowNewVehicle] = useState(false);
  const [showNewClient, setShowNewClient] = useState(false);
  const [showDiagnostic, setShowDiagnostic] = useState(false);
  const [selectedVehicleForDiagnostic, setSelectedVehicleForDiagnostic] = useState<Vehicle | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const { toast } = useToast();

  // Estados para búsqueda y selección de cliente
  const [clientSearch, setClientSearch] = useState('');
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientQuotes, setClientQuotes] = useState<Quote[]>([]);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);

  const [newVehicle, setNewVehicle] = useState({
    folio: '',
    cliente_id: '',
    vehiculo: '',
    marca: '',
    modelo: '',
    año: undefined as number | undefined,
    placas: '',
    color: '',
    problema_reportado: '',
    notas: ''
  });

  const [newClientForm, setNewClientForm] = useState({
    nombre: '',
    telefono: '',
    email: ''
  });

  const [diagnosticForm, setDiagnosticForm] = useState({
    problema_detectado: '',
    descripcion_detallada: '',
    piezas_necesarias: '',
    tiempo_estimado: '',
    costo_estimado: '',
    prioridad: 'media',
    recomendaciones: '',
    tecnico_responsable: ''
  });

  // Fases del proceso con iconos y colores (usando valores válidos del enum)
  const statusPhases: StatusPhase[] = [
    { key: 'recibido', label: 'Recibido', icon: '📥', color: 'text-blue-600', bgColor: 'bg-blue-50 border-blue-200' },
    { key: 'diagnostico', label: 'Diagnóstico', icon: '🔍', color: 'text-purple-600', bgColor: 'bg-purple-50 border-purple-200' },
    { key: 'en_proceso', label: 'En Proceso', icon: '🔧', color: 'text-orange-600', bgColor: 'bg-orange-50 border-orange-200' },
    { key: 'listo_entrega', label: 'Listo para Entrega', icon: '✅', color: 'text-emerald-600', bgColor: 'bg-emerald-50 border-emerald-200' },
    { key: 'entregado', label: 'Entregado', icon: '🚚', color: 'text-gray-600', bgColor: 'bg-gray-50 border-gray-200' }
  ];

  useEffect(() => {
    fetchVehicles();
    fetchClients();
  }, []);

  const fetchVehicles = async () => {
    try {
      console.log('Cargando vehículos desde la base de datos...');
      
      // Intentar cargar desde ordenes_taller primero
      const { data: ordenesData, error: ordenesError } = await supabase
        .from('ordenes_taller')
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
        .order('created_at', { ascending: false });

      console.log('Respuesta de ordenes_taller:', { data: ordenesData, error: ordenesError });

      if (!ordenesError && ordenesData && ordenesData.length > 0) {
        // Mapear datos de ordenes_taller al formato Vehicle
        const mappedVehicles = ordenesData.map((orden: any) => ({
          id: orden.id,
          folio: orden.folio,
          cliente_id: orden.cliente_id,
          cotizacion_id: orden.cotizacion_id,
          vehiculo_marca: orden.vehiculo_marca || 'N/A',
          vehiculo_modelo: orden.vehiculo_modelo || 'N/A',
          vehiculo_año: orden.vehiculo_año,
          vehiculo_placas: orden.vehiculo_placas || 'N/A',
          vehiculo_color: orden.vehiculo_color,
          problema_reportado: orden.problema_reportado || 'N/A',
          notas: orden.notas,
          status: orden.status || 'recibido',
          created_at: orden.created_at,
          fecha_recibido: orden.fecha_recibido,
          fecha_diagnostico: orden.fecha_diagnostico,
          fecha_cotizacion_aprobada: orden.fecha_cotizacion_aprobada,
          fecha_en_proceso: orden.fecha_en_proceso,
          fecha_listo_entrega: orden.fecha_listo_entrega,
          fecha_entregado: orden.fecha_entregado,
          dias_estadia_cargo: orden.dias_estadia_cargo,
          monto_cargo_estadia: orden.monto_cargo_estadia,
          clientes: orden.clientes || { nombre: 'Cliente no encontrado', telefono: '', email: '' }
        }));
        
        console.log('Vehículos mapeados desde ordenes_taller:', mappedVehicles);
        setVehicles(mappedVehicles);
        console.log(`Cargados ${mappedVehicles.length} vehículos desde ordenes_taller`);
        return;
      }
      
      // Si no hay datos en ordenes_taller, intentar vehiculos
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
        console.error('Database error, using fake data:', error);
        setVehicles(getFakeVehicles());
      } else {
        // Mapear datos de la base de datos al formato esperado
        const mappedVehicles = data?.map(vehicle => ({
          id: vehicle.id,
          folio: vehicle.id, // Usar ID como FOLIO temporal
          cliente_id: vehicle.cliente_id,
          cotizacion_id: vehicle.cotizacion_id,
          vehiculo_marca: vehicle.vehiculo?.split(' ')[0] || '',
          vehiculo_modelo: vehicle.vehiculo?.split(' ').slice(1).join(' ') || '',
          vehiculo_año: undefined,
          vehiculo_placas: '',
          vehiculo_color: '',
          problema_reportado: '',
          notas: vehicle.notas || '',
          status: vehicle.status,
          created_at: vehicle.created_at,
          fecha_recibido: vehicle.fecha_recibo,
          fecha_entregado: vehicle.fecha_entrega,
          clientes: vehicle.clientes,
          cotizaciones: vehicle.cotizaciones
        })) || [];
        
        console.log('Vehículos mapeados:', mappedVehicles);
        
        // Siempre mostrar datos reales si existen, sino mostrar fake data
        if (mappedVehicles.length > 0) {
          setVehicles(mappedVehicles);
          console.log(`Cargados ${mappedVehicles.length} vehículos reales`);
        } else {
          console.log('No hay vehículos en la base de datos, usando datos fake');
          setVehicles(getFakeVehicles());
        }
      }
    } catch (error) {
      console.error('Error fetching vehicles, using fake data:', error);
      setVehicles(getFakeVehicles());
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('id, nombre, telefono, email')
        .eq('activo', true)
        .order('nombre');

      if (error) {
        console.error('Database error, using fake clients:', error);
        setClients(getFakeClients());
      } else {
        setClients(data || getFakeClients());
      }
    } catch (error) {
      console.error('Error fetching clients, using fake data:', error);
      setClients(getFakeClients());
    }
  };

  // Función para generar datos fake
  const getFakeVehicles = () => {
    return [
      {
        id: '1',
        folio: 'OT-2024-001',
        cliente_id: '1',
        cotizacion_id: '1',
        vehiculo_marca: 'Honda',
        vehiculo_modelo: 'Civic',
        vehiculo_año: 2020,
        vehiculo_placas: 'ABC-123',
        vehiculo_color: 'Blanco',
        problema_reportado: 'Motor hace ruido extraño y transmisión patina',
        notas: 'Cliente reporta que el problema comenzó hace 2 semanas',
        status: 'entregado' as const,
        created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        fecha_recibido: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        fecha_diagnostico: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
        fecha_cotizacion_aprobada: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
        fecha_en_proceso: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        fecha_listo_entrega: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        fecha_entregado: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        clientes: { nombre: 'María González', telefono: '5551234567' },
        cotizaciones: { descripcion_trabajo: 'Reparación de motor y cambio de transmisión', precio: 8500 }
      },
      {
        id: '2',
        folio: 'OT-2024-002',
        cliente_id: '2',
        cotizacion_id: '2',
        vehiculo_marca: 'Toyota',
        vehiculo_modelo: 'Corolla',
        vehiculo_año: 2019,
        vehiculo_placas: 'XYZ-789',
        vehiculo_color: 'Rojo',
        problema_reportado: 'Golpe en defensa delantera y rayones en pintura',
        notas: 'Accidente menor, seguro cubre reparación',
        status: 'listo_entrega' as const,
        created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
        fecha_recibido: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
        fecha_diagnostico: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        fecha_cotizacion_aprobada: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        fecha_en_proceso: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        fecha_listo_entrega: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        clientes: { nombre: 'Carlos Rodríguez', telefono: '5559876543' },
        cotizaciones: { descripcion_trabajo: 'Pintura completa y reparación de defensa', precio: 4200 }
      },
      {
        id: '3',
        folio: 'OT-2024-003',
        cliente_id: '3',
        cotizacion_id: '3',
        vehiculo_marca: 'Nissan',
        vehiculo_modelo: 'Sentra',
        vehiculo_año: 2021,
        vehiculo_placas: 'DEF-456',
        vehiculo_color: 'Azul',
        problema_reportado: 'Frenos chirrian y volante vibra al frenar',
        notas: 'Mantenimiento preventivo también solicitado',
        status: 'en_proceso' as const,
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        fecha_recibido: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        fecha_diagnostico: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        fecha_cotizacion_aprobada: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        fecha_en_proceso: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        clientes: { nombre: 'Ana Martínez', telefono: '5555555555' },
        cotizaciones: { descripcion_trabajo: 'Cambio de frenos y alineación', precio: 2800 }
      },
      {
        id: '4',
        folio: 'OT-2024-004',
        cliente_id: '4',
        cotizacion_id: '4',
        vehiculo_marca: 'Ford',
        vehiculo_modelo: 'Focus',
        vehiculo_año: 2018,
        vehiculo_placas: 'GHI-789',
        vehiculo_color: 'Negro',
        problema_reportado: 'Suspensión hace ruido y llantas desgastadas',
        notas: 'Cliente quiere llantas de marca específica',
        status: 'cotizacion_aprobada' as const,
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        fecha_recibido: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        fecha_diagnostico: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        fecha_cotizacion_aprobada: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        clientes: { nombre: 'Luis Hernández', telefono: '5552468135' },
        cotizaciones: { descripcion_trabajo: 'Reparación de suspensión y cambio de llantas', precio: 6500 }
      },
      {
        id: '5',
        folio: 'OT-2024-005',
        cliente_id: '5',
        vehiculo_marca: 'Chevrolet',
        vehiculo_modelo: 'Aveo',
        vehiculo_año: 2017,
        vehiculo_placas: 'JKL-012',
        vehiculo_color: 'Gris',
        problema_reportado: 'No enciende, posible problema eléctrico',
        notas: 'Cliente menciona que falló de repente',
        status: 'recibido' as const,
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        fecha_recibido: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        clientes: { nombre: 'Carmen López', telefono: '5557890123' }
      },
      {
        id: '6',
        folio: 'OT-2024-006',
        cliente_id: '1',
        vehiculo_marca: 'Volkswagen',
        vehiculo_modelo: 'Jetta',
        vehiculo_año: 2022,
        vehiculo_placas: 'MNO-345',
        vehiculo_color: 'Plata',
        problema_reportado: 'Aire acondicionado no enfría',
        notas: 'Problema comenzó gradualmente',
        status: 'diagnostico' as const,
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        fecha_recibido: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        fecha_diagnostico: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        clientes: { nombre: 'María González', telefono: '5551234567' }
      }
    ];
  };

  const getFakeClients = () => {
    return [
      { id: '1', nombre: 'María González', telefono: '5551234567' },
      { id: '2', nombre: 'Carlos Rodríguez', telefono: '5559876543' },
      { id: '3', nombre: 'Ana Martínez', telefono: '5555555555' },
      { id: '4', nombre: 'Luis Hernández', telefono: '5552468135' },
      { id: '5', nombre: 'Carmen López', telefono: '5557890123' }
    ];
  };

  // Búsqueda de clientes
  const searchClients = (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setFilteredClients([]);
      return;
    }

    const filtered = clients.filter(client => 
      client.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.telefono.includes(searchTerm)
    );
    setFilteredClients(filtered);
  };

  // Seleccionar cliente y cargar sus cotizaciones
  const selectClient = async (client: Client) => {
    setSelectedClient(client);
    setClientSearch(client.nombre);
    setFilteredClients([]);
    setNewVehicle(prev => ({ ...prev, cliente_id: client.id }));
    
    // Cargar cotizaciones del cliente
    await fetchClientQuotes(client.id);
  };

  // Obtener cotizaciones del cliente
  const fetchClientQuotes = async (clientId: string) => {
    try {
      const { data, error } = await supabase
        .from('cotizaciones')
        .select('id, vehiculo, precio, created_at, descripcion_trabajo')
        .eq('cliente_id', clientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClientQuotes(data || []);
    } catch (error) {
      console.error('Error fetching client quotes:', error);
      setClientQuotes([]);
    }
  };

  // Abrir modal de diagnóstico
  const openDiagnosticModal = (vehicle: Vehicle) => {
    setSelectedVehicleForDiagnostic(vehicle);
    
    // Extraer datos del diagnóstico existente de las notas si existe
    if (vehicle.notas && vehicle.notas.includes('=== DIAGNÓSTICO TÉCNICO ===')) {
      try {
        const diagnosticSection = vehicle.notas.split('=== DIAGNÓSTICO TÉCNICO ===')[1];
        if (diagnosticSection) {
          const lines = diagnosticSection.split('\n');
          
          // Extraer información del diagnóstico
          let problema = '';
          let descripcion = '';
          let piezas = '';
          let tiempo = '';
          let costo = '';
          let prioridad = 'media';
          let recomendaciones = '';
          let tecnico = '';
          
          let currentSection = '';
          
          for (const line of lines) {
            const trimmedLine = line.trim();
            
            if (trimmedLine.startsWith('Técnico:')) {
              tecnico = trimmedLine.replace('Técnico:', '').trim();
              if (tecnico === 'N/A') tecnico = '';
            } else if (trimmedLine === 'PROBLEMA DETECTADO:') {
              currentSection = 'problema';
            } else if (trimmedLine === 'DESCRIPCIÓN DETALLADA:') {
              currentSection = 'descripcion';
            } else if (trimmedLine === 'PIEZAS NECESARIAS:') {
              currentSection = 'piezas';
            } else if (trimmedLine.startsWith('TIEMPO ESTIMADO:')) {
              tiempo = trimmedLine.replace('TIEMPO ESTIMADO:', '').trim();
              if (tiempo === 'N/A') tiempo = '';
            } else if (trimmedLine.startsWith('COSTO ESTIMADO:')) {
              costo = trimmedLine.replace('COSTO ESTIMADO: $', '').trim();
              if (costo === '0.00') costo = '';
            } else if (trimmedLine.startsWith('PRIORIDAD:')) {
              const prioridadText = trimmedLine.replace('PRIORIDAD:', '').trim().toLowerCase();
              if (['baja', 'media', 'alta', 'critica'].includes(prioridadText)) {
                prioridad = prioridadText;
              }
            } else if (trimmedLine === 'RECOMENDACIONES:') {
              currentSection = 'recomendaciones';
            } else if (trimmedLine === '========================') {
              break;
            } else if (trimmedLine && !trimmedLine.startsWith('Fecha:')) {
              // Agregar contenido a la sección actual
              switch (currentSection) {
                case 'problema':
                  problema += (problema ? ' ' : '') + trimmedLine;
                  break;
                case 'descripcion':
                  descripcion += (descripcion ? ' ' : '') + trimmedLine;
                  break;
                case 'piezas':
                  if (trimmedLine !== 'N/A') {
                    piezas += (piezas ? ' ' : '') + trimmedLine;
                  }
                  break;
                case 'recomendaciones':
                  if (trimmedLine !== 'N/A') {
                    recomendaciones += (recomendaciones ? ' ' : '') + trimmedLine;
                  }
                  break;
              }
            }
          }
          
          // Llenar el formulario con los datos extraídos
          setDiagnosticForm({
            problema_detectado: problema,
            descripcion_detallada: descripcion,
            piezas_necesarias: piezas,
            tiempo_estimado: tiempo,
            costo_estimado: costo,
            prioridad: prioridad,
            recomendaciones: recomendaciones,
            tecnico_responsable: tecnico
          });
          
          console.log('Diagnóstico recuperado:', {
            problema, descripcion, piezas, tiempo, costo, prioridad, recomendaciones, tecnico
          });
        }
      } catch (error) {
        console.error('Error extrayendo diagnóstico existente:', error);
        // Si hay error, usar formulario vacío
        setDiagnosticForm({
          problema_detectado: '',
          descripcion_detallada: '',
          piezas_necesarias: '',
          tiempo_estimado: '',
          costo_estimado: '',
          prioridad: 'media',
          recomendaciones: '',
          tecnico_responsable: ''
        });
      }
    } else {
      // No hay diagnóstico previo, usar formulario vacío
      setDiagnosticForm({
        problema_detectado: '',
        descripcion_detallada: '',
        piezas_necesarias: '',
        tiempo_estimado: '',
        costo_estimado: '',
        prioridad: 'media',
        recomendaciones: '',
        tecnico_responsable: ''
      });
    }
    
    setShowDiagnostic(true);
  };

  // Guardar diagnóstico
  const saveDiagnostic = async () => {
    if (!selectedVehicleForDiagnostic || !diagnosticForm.problema_detectado || !diagnosticForm.descripcion_detallada) {
      toast({
        title: "Error",
        description: "Problema detectado y descripción detallada son campos requeridos",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('Iniciando guardado de diagnóstico para vehículo:', selectedVehicleForDiagnostic.id);
      
      // Crear el texto del diagnóstico para guardar en notas
      const diagnosticText = `
=== DIAGNÓSTICO TÉCNICO ===
Fecha: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}
Técnico: ${diagnosticForm.tecnico_responsable || 'N/A'}

PROBLEMA DETECTADO:
${diagnosticForm.problema_detectado}

DESCRIPCIÓN DETALLADA:
${diagnosticForm.descripcion_detallada}

PIEZAS NECESARIAS:
${diagnosticForm.piezas_necesarias || 'N/A'}

TIEMPO ESTIMADO: ${diagnosticForm.tiempo_estimado || 'N/A'}
COSTO ESTIMADO: $${diagnosticForm.costo_estimado || '0.00'}
PRIORIDAD: ${diagnosticForm.prioridad.toUpperCase()}

RECOMENDACIONES:
${diagnosticForm.recomendaciones || 'N/A'}
========================
      `;

      // Obtener las notas actuales del vehículo
      const currentNotes = selectedVehicleForDiagnostic.notas || '';
      const updatedNotes = currentNotes + '\n\n' + diagnosticText;

      console.log('Actualizando vehículo con diagnóstico...');
      
      // Actualizar el vehículo con el diagnóstico en las notas y cambiar estado
      const { data: updateData, error: updateError } = await supabase
        .from('vehiculos')
        .update({ 
          notas: updatedNotes,
          status: 'en_proceso'
        })
        .eq('id', selectedVehicleForDiagnostic.id)
        .select();

      if (updateError) {
        console.error('Error actualizando vehículo:', updateError);
        throw updateError;
      }

      console.log('Diagnóstico guardado exitosamente');

      toast({
        title: "Diagnóstico guardado",
        description: `Diagnóstico registrado para vehículo ${selectedVehicleForDiagnostic.folio}`,
      });

      // Resetear formulario y cerrar modal
      setDiagnosticForm({
        problema_detectado: '',
        descripcion_detallada: '',
        piezas_necesarias: '',
        tiempo_estimado: '',
        costo_estimado: '',
        prioridad: 'media',
        recomendaciones: '',
        tecnico_responsable: ''
      });
      setShowDiagnostic(false);
      setSelectedVehicleForDiagnostic(null);
      
      // Recargar la lista de vehículos
      await fetchVehicles();
      
    } catch (error) {
      console.error('Error completo saving diagnostic:', error);
      toast({
        title: "Error",
        description: `No se pudo guardar el diagnóstico: ${error.message || 'Error desconocido'}`,
        variant: "destructive",
      });
    }
  };

  // Crear nuevo cliente
  const createNewClient = async () => {
    if (!newClientForm.nombre || !newClientForm.telefono) {
      toast({
        title: "Error",
        description: "Nombre y teléfono son campos requeridos",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('clientes')
        .insert({
          nombre: newClientForm.nombre,
          telefono: newClientForm.telefono,
          email: newClientForm.email || null,
          tipo_cliente: 'individual'
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Cliente creado",
        description: `${newClientForm.nombre} ha sido registrado`,
      });

      // Seleccionar el nuevo cliente
      selectClient(data);
      setNewClientForm({ nombre: '', telefono: '', email: '' });
      setShowNewClient(false);
      fetchClients(); // Actualizar lista
    } catch (error) {
      console.error('Error creating client:', error);
      toast({
        title: "Error",
        description: "No se pudo crear el cliente",
        variant: "destructive",
      });
    }
  };

  // Crear nuevo vehículo
  const createVehicle = async () => {
    if (!newVehicle.folio || !selectedClient?.id || !newVehicle.marca || !newVehicle.modelo || !newVehicle.placas) {
      toast({
        title: "Error",
        description: "FOLIO, cliente, marca, modelo y placas son campos requeridos",
        variant: "destructive",
      });
      return;
    }

    try {
      const vehiculoString = `${newVehicle.marca} ${newVehicle.modelo} ${newVehicle.año || ''}`.trim();
      
      const { error } = await supabase
        .from('vehiculos')
        .insert({
          cliente_id: selectedClient.id,
          cotizacion_id: selectedQuote?.id || null,
          vehiculo: vehiculoString,
          notas: `FOLIO: ${newVehicle.folio}\nPlacas: ${newVehicle.placas}\nColor: ${newVehicle.color || 'N/A'}\nProblema: ${newVehicle.problema_reportado || 'N/A'}\nNotas: ${newVehicle.notas || 'N/A'}`,
          status: 'recibido'
        });

      if (error) throw error;

      toast({
        title: "Vehículo ingresado",
        description: `Vehículo ${newVehicle.folio} registrado exitosamente`,
      });

      // Resetear formulario
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
      setClientQuotes([]);
      setShowNewVehicle(false);
      fetchVehicles();
    } catch (error) {
      console.error('Error creating vehicle:', error);
      toast({
        title: "Error",
        description: "No se pudo crear el vehículo",
        variant: "destructive",
      });
    }
  };

  const updateVehicleStatus = async (id: string, status: string) => {
    // Si el estado es 'diagnostico', abrir el modal de diagnóstico
    if (status === 'diagnostico') {
      const vehicle = vehicles.find(v => v.id === id);
      if (vehicle) {
        openDiagnosticModal(vehicle);
      }
      return;
    }

    try {
      const updates: any = { status };
      
      if (status === 'entregado') {
        updates.fecha_entrega = new Date().toISOString();
      }

      const { error } = await supabase
        .from('vehiculos')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      const statusLabel = statusPhases.find(p => p.key === status)?.label || status;
      toast({
        title: "Estado actualizado",
        description: `El vehículo ha sido marcado como ${statusLabel}`,
      });

      fetchVehicles();
    } catch (error) {
      console.error('Error updating vehicle:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado",
        variant: "destructive",
      });
    }
  };

  // Calcular días en taller y cargo por estadía
  const calculateStayInfo = (vehicle: Vehicle) => {
    const fechaIngreso = new Date(vehicle.created_at);
    const fechaActual = new Date();
    const diasEnTaller = Math.ceil((fechaActual.getTime() - fechaIngreso.getTime()) / (1000 * 60 * 60 * 24));
    
    let diasDesdeTerminacion = 0;
    let cargoEstadia = 0;
    
    if (vehicle.status === 'listo_entrega' && vehicle.fecha_listo_entrega) {
      const fechaListo = new Date(vehicle.fecha_listo_entrega);
      diasDesdeTerminacion = Math.ceil((fechaActual.getTime() - fechaListo.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diasDesdeTerminacion > 3) {
        cargoEstadia = (diasDesdeTerminacion - 3) * 150;
      }
    }
    
    return { diasEnTaller, diasDesdeTerminacion, cargoEstadia };
  };

  // Aplicar cargo por estadía
  const applyStayCharge = async (vehicleId: string, amount: number) => {
    toast({
      title: "Cargo aplicado (demo)",
      description: `Se aplicaría un cargo de $${amount.toLocaleString()} por estadía`,
    });
  };

  // Renderizar barra de progreso con fases
  const renderProgressBar = (vehicle: Vehicle) => {
    const currentPhaseIndex = statusPhases.findIndex(phase => phase.key === vehicle.status);
    
    return (
      <div className="space-y-3">
        <div className="flex justify-between items-center text-xs text-gray-500">
          <span>Progreso del Vehículo</span>
          <span>{Math.round(((currentPhaseIndex + 1) / statusPhases.length) * 100)}%</span>
        </div>
        
        <div className="flex items-center space-x-1">
          {statusPhases.map((phase, index) => {
            const isCompleted = index <= currentPhaseIndex;
            const isCurrent = index === currentPhaseIndex;
            
            return (
              <div key={phase.key} className="flex items-center flex-1">
                <button
                  onClick={() => updateVehicleStatus(vehicle.id, phase.key)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all ${
                    isCompleted 
                      ? 'bg-green-500 text-white' 
                      : isCurrent 
                      ? 'bg-blue-500 text-white animate-pulse'
                      : 'bg-gray-200 text-gray-400 hover:bg-gray-300'
                  }`}
                  title={phase.label}
                >
                  {phase.icon}
                </button>
                {index < statusPhases.length - 1 && (
                  <div className={`flex-1 h-1 mx-1 rounded ${
                    isCompleted ? 'bg-green-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            );
          })}
        </div>
        
        <div className="text-center">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            statusPhases[currentPhaseIndex]?.bgColor || 'bg-gray-50 border-gray-200'
          } border`}>
            {statusPhases[currentPhaseIndex]?.icon} {statusPhases[currentPhaseIndex]?.label}
          </span>
        </div>
      </div>
    );
  };

  const filteredVehicles = filterStatus === 'all' 
    ? vehicles 
    : vehicles.filter(v => v.status === filterStatus);

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
          <h1 className="text-3xl font-bold text-white">Control de Vehículos</h1>
          <p className="text-muted-foreground">
            Seguimiento completo de vehículos en el taller
          </p>
        </div>
        <Dialog open={showNewVehicle} onOpenChange={setShowNewVehicle}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Ingresar Vehículo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl overflow-x-auto">
            <DialogHeader>
              <DialogTitle>Nueva Orden de Taller</DialogTitle>
              <DialogDescription>
                Crear orden con FOLIO físico y relacionar cliente/cotización
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
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

              {/* Búsqueda/Alta de Cliente */}
              <div className="space-y-3">
                <Label>Cliente *</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Buscar por nombre o teléfono..."
                    value={clientSearch}
                    onChange={(e) => {
                      setClientSearch(e.target.value);
                      searchClients(e.target.value);
                    }}
                    className="flex-1"
                  />
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => setShowNewClient(true)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Nuevo
                  </Button>
                </div>
                
                {/* Resultados de búsqueda */}
                {filteredClients.length > 0 && clientSearch && (
                  <div className="border rounded-md max-h-32 overflow-y-auto">
                    {filteredClients.map((client) => (
                      <div
                        key={client.id}
                        className="p-2 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                        onClick={() => selectClient(client)}
                      >
                        <p className="font-medium">{client.nombre}</p>
                        <p className="text-sm text-muted-foreground">{client.telefono}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Cliente seleccionado */}
                {selectedClient && (
                  <div className="p-3 bg-blue-50 rounded-md border border-blue-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-blue-900">{selectedClient.nombre}</p>
                        <p className="text-sm text-blue-700">{selectedClient.telefono}</p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedClient(null);
                          setClientSearch('');
                          setClientQuotes([]);
                        }}
                      >
                        ×
                      </Button>
                    </div>
                    
                    {/* Cotizaciones del cliente */}
                    {clientQuotes.length > 0 ? (
                      <div className="mt-3 space-y-2">
                        <Label className="text-sm font-medium text-blue-900">
                          Cotizaciones disponibles:
                        </Label>
                        <div className="space-y-1">
                          {clientQuotes.map((quote) => (
                            <div
                              key={quote.id}
                              className={`p-2 rounded border cursor-pointer transition-colors ${
                                selectedQuote?.id === quote.id
                                  ? 'bg-blue-100 border-blue-300'
                                  : 'bg-white border-gray-200 hover:bg-gray-50'
                              }`}
                              onClick={() => {
                                setSelectedQuote(quote);
                                // Auto-llenar campos del vehículo desde la cotización
                                if (quote.vehiculo) {
                                  // Parsear el string del vehículo (ej: "Harley Davidson Softail 2025")
                                  const vehiculoParts = quote.vehiculo.trim().split(' ');
                                  let marca = '';
                                  let modelo = '';
                                  let año = undefined;
                                  
                                  if (vehiculoParts.length >= 2) {
                                    // Verificar si el último elemento es un año
                                    const lastPart = vehiculoParts[vehiculoParts.length - 1];
                                    const isYear = /^\d{4}$/.test(lastPart) && parseInt(lastPart) >= 1900 && parseInt(lastPart) <= 2030;
                                    
                                    if (isYear) {
                                      año = parseInt(lastPart);
                                      marca = vehiculoParts[0];
                                      modelo = vehiculoParts.slice(1, -1).join(' ');
                                    } else {
                                      marca = vehiculoParts[0];
                                      modelo = vehiculoParts.slice(1).join(' ');
                                    }
                                  } else {
                                    marca = vehiculoParts[0] || '';
                                  }
                                  
                                  setNewVehicle(prev => ({
                                    ...prev,
                                    marca: marca,
                                    modelo: modelo,
                                    año: año || prev.año,
                                    problema_reportado: quote.descripcion_trabajo || prev.problema_reportado
                                  }));
                                }
                              }}
                            >
                              <div className="flex justify-between items-center">
                                <div>
                                  <p className="text-sm font-medium">{quote.vehiculo}</p>
                                  <p className="text-xs text-muted-foreground">
                                    ${quote.precio?.toLocaleString()} - {new Date(quote.created_at).toLocaleDateString()}
                                  </p>
                                </div>
                                {selectedQuote?.id === quote.id && (
                                  <CheckCircle className="h-4 w-4 text-blue-600" />
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                        <p className="text-sm text-yellow-800 font-medium">
                          ⚠️ No hay cotizaciones para este cliente
                        </p>
                        <p className="text-xs text-yellow-700 mt-1">
                          Se recomienda crear una cotización antes de proceder
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Información del vehículo */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="marca">Marca *</Label>
                  <Input
                    id="marca"
                    value={newVehicle.marca}
                    onChange={(e) => setNewVehicle({...newVehicle, marca: e.target.value})}
                    placeholder="Ej: Honda, Toyota"
                  />
                </div>
                <div>
                  <Label htmlFor="modelo">Modelo *</Label>
                  <Input
                    id="modelo"
                    value={newVehicle.modelo}
                    onChange={(e) => setNewVehicle({...newVehicle, modelo: e.target.value})}
                    placeholder="Ej: Civic, Corolla"
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
                    onChange={(e) => setNewVehicle({...newVehicle, año: e.target.value ? parseInt(e.target.value) : undefined})}
                    placeholder="2020"
                  />
                </div>
                <div>
                  <Label htmlFor="placas">Placas *</Label>
                  <Input
                    id="placas"
                    value={newVehicle.placas}
                    onChange={(e) => setNewVehicle({...newVehicle, placas: e.target.value})}
                    placeholder="ABC-123"
                  />
                </div>
                <div>
                  <Label htmlFor="color">Color</Label>
                  <Input
                    id="color"
                    value={newVehicle.color}
                    onChange={(e) => setNewVehicle({...newVehicle, color: e.target.value})}
                    placeholder="Blanco, Azul"
                  />
                </div>
              </div>

              {/* Problema reportado */}
              <div>
                <Label htmlFor="problema">Problema Reportado</Label>
                <Textarea
                  id="problema"
                  value={newVehicle.problema_reportado || ''}
                  onChange={(e) => setNewVehicle({...newVehicle, problema_reportado: e.target.value})}
                  placeholder="Descripción del problema que reporta el cliente..."
                  rows={2}
                />
              </div>

              {/* Notas adicionales */}
              <div>
                <Label htmlFor="notas">Notas de Ingreso</Label>
                <Textarea
                  id="notas"
                  value={newVehicle.notas}
                  onChange={(e) => setNewVehicle({...newVehicle, notas: e.target.value})}
                  placeholder="Condición del vehículo, observaciones del técnico, etc."
                  rows={2}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => {
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
              }}>
                Cancelar
              </Button>
              <Button onClick={createVehicle}>
                Crear Orden
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog para crear nuevo cliente */}
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
                  placeholder="Ej: 8114567890"
                />
              </div>
              <div>
                <Label htmlFor="email-cliente">Email (Opcional)</Label>
                <Input
                  id="email-cliente"
                  type="email"
                  value={newClientForm.email}
                  onChange={(e) => setNewClientForm({...newClientForm, email: e.target.value})}
                  placeholder="Ej: juan@email.com"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => {
                setShowNewClient(false);
                setNewClientForm({ nombre: '', telefono: '', email: '' });
              }}>
                Cancelar
              </Button>
              <Button onClick={createNewClient}>
                Crear Cliente
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog para diagnóstico técnico */}
        <Dialog open={showDiagnostic} onOpenChange={setShowDiagnostic}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Diagnóstico Técnico</DialogTitle>
              <DialogDescription>
                Registrar diagnóstico detallado del vehículo {selectedVehicleForDiagnostic?.folio}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              {/* Información del vehículo */}
              {selectedVehicleForDiagnostic && (
                <div className="p-4 bg-gray-50 rounded-lg border">
                  <h3 className="font-semibold text-gray-900 mb-2">Información del Vehículo</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">FOLIO:</span> {selectedVehicleForDiagnostic.folio}
                    </div>
                    <div>
                      <span className="font-medium">Cliente:</span> {selectedVehicleForDiagnostic.clientes?.nombre}
                    </div>
                    <div>
                      <span className="font-medium">Vehículo:</span> {selectedVehicleForDiagnostic.vehiculo_marca} {selectedVehicleForDiagnostic.vehiculo_modelo}
                    </div>
                    <div>
                      <span className="font-medium">Problema Reportado:</span> {selectedVehicleForDiagnostic.problema_reportado || 'N/A'}
                    </div>
                  </div>
                </div>
              )}

              {/* Problema detectado */}
              <div>
                <Label htmlFor="problema-detectado">Problema Detectado *</Label>
                <Input
                  id="problema-detectado"
                  value={diagnosticForm.problema_detectado}
                  onChange={(e) => setDiagnosticForm({...diagnosticForm, problema_detectado: e.target.value})}
                  placeholder="Ej: Falla en sistema de frenos, Motor no enciende"
                  className="mt-1"
                />
              </div>

              {/* Descripción detallada */}
              <div>
                <Label htmlFor="descripcion-detallada">Descripción Detallada *</Label>
                <Textarea
                  id="descripcion-detallada"
                  value={diagnosticForm.descripcion_detallada}
                  onChange={(e) => setDiagnosticForm({...diagnosticForm, descripcion_detallada: e.target.value})}
                  placeholder="Descripción técnica completa del problema encontrado, síntomas observados, pruebas realizadas..."
                  rows={4}
                  className="mt-1"
                />
              </div>

              {/* Piezas necesarias */}
              <div>
                <Label htmlFor="piezas-necesarias">Piezas/Componentes Necesarios</Label>
                <Textarea
                  id="piezas-necesarias"
                  value={diagnosticForm.piezas_necesarias}
                  onChange={(e) => setDiagnosticForm({...diagnosticForm, piezas_necesarias: e.target.value})}
                  placeholder="Lista de piezas, refacciones o componentes que necesitan ser reemplazados o reparados..."
                  rows={3}
                  className="mt-1"
                />
              </div>

              {/* Tiempo y costo estimado */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tiempo-estimado">Tiempo Estimado de Reparación</Label>
                  <Input
                    id="tiempo-estimado"
                    value={diagnosticForm.tiempo_estimado}
                    onChange={(e) => setDiagnosticForm({...diagnosticForm, tiempo_estimado: e.target.value})}
                    placeholder="Ej: 2-3 días, 1 semana"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="costo-estimado">Costo Estimado ($)</Label>
                  <Input
                    id="costo-estimado"
                    type="number"
                    step="0.01"
                    value={diagnosticForm.costo_estimado}
                    onChange={(e) => setDiagnosticForm({...diagnosticForm, costo_estimado: e.target.value})}
                    placeholder="0.00"
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Prioridad */}
              <div>
                <Label htmlFor="prioridad">Prioridad de Reparación</Label>
                <Select value={diagnosticForm.prioridad} onValueChange={(value) => setDiagnosticForm({...diagnosticForm, prioridad: value})}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baja">🟢 Baja - No urgente</SelectItem>
                    <SelectItem value="media">🟡 Media - Normal</SelectItem>
                    <SelectItem value="alta">🟠 Alta - Urgente</SelectItem>
                    <SelectItem value="critica">🔴 Crítica - Inmediata</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Recomendaciones */}
              <div>
                <Label htmlFor="recomendaciones">Recomendaciones Adicionales</Label>
                <Textarea
                  id="recomendaciones"
                  value={diagnosticForm.recomendaciones}
                  onChange={(e) => setDiagnosticForm({...diagnosticForm, recomendaciones: e.target.value})}
                  placeholder="Recomendaciones de mantenimiento preventivo, cuidados especiales, etc..."
                  rows={3}
                  className="mt-1"
                />
              </div>

              {/* Técnico responsable */}
              <div>
                <Label htmlFor="tecnico-responsable">Técnico Responsable</Label>
                <Input
                  id="tecnico-responsable"
                  value={diagnosticForm.tecnico_responsable}
                  onChange={(e) => setDiagnosticForm({...diagnosticForm, tecnico_responsable: e.target.value})}
                  placeholder="Nombre del técnico que realizó el diagnóstico"
                  className="mt-1"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button variant="outline" onClick={() => {
                setShowDiagnostic(false);
                setSelectedVehicleForDiagnostic(null);
                setDiagnosticForm({
                  problema_detectado: '',
                  descripcion_detallada: '',
                  piezas_necesarias: '',
                  tiempo_estimado: '',
                  costo_estimado: '',
                  prioridad: 'media',
                  recomendaciones: '',
                  tecnico_responsable: ''
                });
              }}>
                Cancelar
              </Button>
              <Button onClick={saveDiagnostic}>
                Guardar Diagnóstico
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="recibido">📥 Recibido</SelectItem>
              <SelectItem value="diagnostico">🔍 Diagnóstico</SelectItem>
              <SelectItem value="cotizacion_aprobada">💰 Cotización Aprobada</SelectItem>
              <SelectItem value="en_proceso">🔧 En Proceso</SelectItem>
              <SelectItem value="listo_entrega">✅ Listo para Entrega</SelectItem>
              <SelectItem value="entregado">🚚 Entregado</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Lista de Vehículos */}
      <div className="grid gap-4">
        {filteredVehicles.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Car className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay vehículos</h3>
              <p className="text-muted-foreground">
                {vehicles.length === 0 
                  ? "Cargando datos de demostración..." 
                  : "No hay vehículos con el estado seleccionado"
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredVehicles.map((vehicle) => {
            const stayInfo = calculateStayInfo(vehicle);
            const folio = vehicle.folio || 'Sin FOLIO';
            const marca = vehicle.vehiculo_marca || '';
            const modelo = vehicle.vehiculo_modelo || '';
            const año = vehicle.vehiculo_año || '';
            const placas = vehicle.vehiculo_placas || '';
            const color = vehicle.vehiculo_color || '';
            
            return (
              <Card key={vehicle.id} className="overflow-hidden">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono text-xs">
                          {folio}
                        </Badge>
                        <CardTitle className="text-lg">
                          {`${marca} ${modelo} ${año}`.trim()}
                        </CardTitle>
                      </div>
                      <CardDescription className="space-y-1">
                        <div>Cliente: {vehicle.clientes.nombre} • Tel: {vehicle.clientes.telefono}</div>
                        {placas && <div>Placas: {placas} {color && `• Color: ${color}`}</div>}
                      </CardDescription>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <div className="text-right text-xs text-gray-500">
                        <div>Días en taller: <span className="font-semibold">{stayInfo.diasEnTaller}</span></div>
                        {stayInfo.diasDesdeTerminacion > 0 && (
                          <div className="text-orange-600">
                            Días desde terminación: <span className="font-semibold">{stayInfo.diasDesdeTerminacion}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Barra de Progreso Interactiva */}
                  {renderProgressBar(vehicle)}
                  
                  {/* Alerta de Cargo por Estadía */}
                  {stayInfo.cargoEstadia > 0 && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium text-red-800 flex items-center">
                            <AlertTriangle className="h-4 w-4 mr-1" />
                            Cargo adicional por estadía
                          </p>
                          <p className="text-xs text-red-700 mt-1">
                            ${stayInfo.cargoEstadia.toLocaleString()} por {stayInfo.diasDesdeTerminacion - 3} días adicionales ($150/día a partir del 4º día)
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => applyStayCharge(vehicle.id, stayInfo.cargoEstadia)}
                        >
                          Aplicar Cargo
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Información de Fechas */}
                  <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-lg text-xs">
                    <div>
                      <p className="font-medium text-gray-600">Fecha Ingreso</p>
                      <p className="text-gray-800">{new Date(vehicle.created_at).toLocaleDateString('es-MX')}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-600">Fecha Entrega</p>
                      <p className="text-gray-800">
                        {vehicle.fecha_entregado 
                          ? new Date(vehicle.fecha_entregado).toLocaleDateString('es-MX')
                          : 'Pendiente'
                        }
                      </p>
                    </div>
                  </div>

                  {/* Información de cotización */}
                  {vehicle.cotizaciones && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm font-medium text-blue-800 mb-1">Trabajo Cotizado</p>
                      <p className="text-sm text-blue-700 mb-2">{vehicle.cotizaciones.descripcion_trabajo}</p>
                      <p className="text-lg font-bold text-blue-800">${vehicle.cotizaciones.precio?.toLocaleString()}</p>
                    </div>
                  )}

                  {/* Problema reportado y notas */}
                  <div className="space-y-3">
                    {vehicle.problema_reportado && (
                      <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                        <p className="text-sm font-medium text-orange-800 mb-1">Problema Reportado</p>
                        <div className="text-sm text-orange-700">{vehicle.problema_reportado}</div>
                      </div>
                    )}
                    {vehicle.notas && (
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm font-medium text-yellow-800 mb-1">Notas Adicionales</p>
                        <div className="text-sm text-yellow-700 whitespace-pre-line">{vehicle.notas}</div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default VehiclesPage;
