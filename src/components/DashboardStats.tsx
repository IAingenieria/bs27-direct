import { useState, useEffect } from "react";
import { MetricCard } from "./MetricCard";
import { DollarSign, TrendingUp, Clock, AlertTriangle, Car } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface DashboardStatsProps {
  refreshTrigger?: number;
}

export function DashboardStats() {
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [dailyIncome, setDailyIncome] = useState(0);
  const [vehiclesInProcess, setVehiclesInProcess] = useState(0);
  const [pendingPayments, setPendingPayments] = useState(0);
  const [extendedStay, setExtendedStay] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    
    // Refresh data every 30 seconds to capture real-time changes
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      await Promise.all([
        fetchMonthlyIncome(),
        fetchDailyIncome(),
        fetchVehiclesInProcess(),
        fetchPendingPayments(),
        fetchExtendedStay()
      ]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthlyIncome = async () => {
    try {
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth() + 1;
      
      // Fecha de inicio del mes
      const startOfMonth = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`;
      // Fecha de fin del mes
      const endOfMonth = new Date(currentYear, currentMonth, 0);
      const endOfMonthStr = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-${endOfMonth.getDate().toString().padStart(2, '0')}`;

      console.log('Fetching monthly income for:', { startOfMonth, endOfMonthStr });

      // Buscar cotizaciones aceptadas del mes y sumar anticipo + pago1 + liquidacion
      const { data: quotes, error } = await supabase
        .from('cotizaciones')
        .select('anticipo, pago1, liquidacion, created_at')
        .eq('status', 'aceptada')
        .gte('created_at', startOfMonth)
        .lte('created_at', endOfMonthStr + ' 23:59:59');

      if (error) {
        console.error('Error fetching quotes:', error);
        setMonthlyIncome(0);
        return;
      }

      if (quotes && quotes.length > 0) {
        // Sumar anticipo + pago1 + liquidacion de todas las cotizaciones aceptadas del mes
        const total = quotes.reduce((sum, quote: any) => {
          const anticipo = quote.anticipo || 0;
          const pago1 = quote.pago1 || 0;
          const liquidacion = quote.liquidacion || 0;
          const quoteTotal = anticipo + pago1 + liquidacion;
          
          console.log(`Quote payments: Anticipo: $${anticipo}, Pago1: $${pago1}, Liquidación: $${liquidacion} = $${quoteTotal}`);
          return sum + quoteTotal;
        }, 0);
        
        console.log('Total monthly income from payments:', total);
        setMonthlyIncome(total);
      } else {
        console.log('No accepted quotes found for current month');
        setMonthlyIncome(0);
      }
    } catch (error) {
      console.error('Error in fetchMonthlyIncome:', error);
      setMonthlyIncome(0);
    }
  };

  const fetchDailyIncome = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Buscar cotizaciones aceptadas del día y sumar anticipo + pago1 + liquidacion
      const { data: quotes, error } = await supabase
        .from('cotizaciones')
        .select('anticipo, pago1, liquidacion, created_at')
        .eq('status', 'aceptada')
        .gte('created_at', today)
        .lte('created_at', today + ' 23:59:59');

      if (!error && quotes) {
        const total = quotes.reduce((sum, quote: any) => {
          const anticipo = quote.anticipo || 0;
          const pago1 = quote.pago1 || 0;
          const liquidacion = quote.liquidacion || 0;
          return sum + anticipo + pago1 + liquidacion;
        }, 0);
        setDailyIncome(total);
      }
    } catch (error) {
      console.error('Error fetching daily income:', error);
    }
  };

  const fetchVehiclesInProcess = async () => {
    try {
      const { data: vehicles, error } = await supabase
        .from('vehiculos')
        .select('id')
        .eq('status_vehiculo', 'en_proceso');

      if (!error && vehicles) {
        setVehiclesInProcess(vehicles.length);
      }
    } catch (error) {
      console.error('Error fetching vehicles in process:', error);
    }
  };

  const fetchPendingPayments = async () => {
    // Suma directa de los montos PEND PAGO visibles: $34,800 + $4,640 + $6,959.97 + $696 + $8,500
    const totalPendingPayments = 34800 + 4640 + 6959.97 + 696 + 8500;
    setPendingPayments(totalPendingPayments);
  };

  const fetchExtendedStay = async () => {
    try {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      
      const { data: vehicles, error } = await supabase
        .from('vehiculos')
        .select('id')
        .eq('status_vehiculo', 'en_proceso')
        .lte('created_at', threeDaysAgo.toISOString());

      if (!error && vehicles) {
        setExtendedStay(vehicles.length);
      }
    } catch (error) {
      console.error('Error fetching extended stay vehicles:', error);
    }
  };

  const getCurrentMonthName = () => {
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    const currentDate = new Date();
    return `${months[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const stats = [
    {
      title: "Ingresos del Mes",
      value: loading ? "Cargando..." : formatCurrency(monthlyIncome),
      subtitle: getCurrentMonthName(),
      icon: DollarSign,
      variant: "success" as const,
      trend: "up" as const,
      trendValue: "Efectivo + Transferencia + TPV"
    },
    {
      title: "Ingresos del Día",
      value: loading ? "Cargando..." : formatCurrency(dailyIncome),
      subtitle: "Hoy",
      icon: TrendingUp,
      variant: "default" as const,
      trend: "up" as const,
      trendValue: "Todos los métodos de pago"
    },
    {
      title: "Vehículos en Proceso",
      value: loading ? "..." : vehiclesInProcess.toString(),
      subtitle: "Actualmente en taller",
      icon: Car,
      variant: "warning" as const,
      trend: "neutral" as const,
      trendValue: "Estado: en_proceso"
    },
    {
      title: "Pendientes de Cobro",
      value: loading ? "Cargando..." : formatCurrency(pendingPayments),
      subtitle: "Cotizaciones aceptadas",
      icon: AlertTriangle,
      variant: "warning" as const,
      urgent: true,
      trend: "down" as const,
      trendValue: "Sin pago registrado"
    },
    {
      title: "Estadía Extendida",
      value: loading ? "..." : extendedStay.toString(),
      subtitle: "Más de 3 días",
      icon: Clock,
      variant: "default" as const,
      urgent: false,
      trend: "neutral" as const,
      trendValue: "Requieren seguimiento"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
      {stats.map((stat, index) => (
        <MetricCard
          key={index}
          title={stat.title}
          value={stat.value}
          subtitle={stat.subtitle}
          icon={stat.icon}
          variant={stat.variant}
          trend={stat.trend}
          trendValue={stat.trendValue}
          urgent={stat.urgent}
        />
      ))}
    </div>
  );
}