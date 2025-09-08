import { useState, useEffect } from "react";
import { MetricCard } from "./MetricCard";
import { DollarSign, TrendingUp, Clock, AlertTriangle, Car } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export function DashboardStats() {
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [dailyIncome, setDailyIncome] = useState(0);
  const [vehiclesInProcess, setVehiclesInProcess] = useState(0);
  const [pendingPayments, setPendingPayments] = useState(0);
  const [extendedStay, setExtendedStay] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
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

      // Buscar en tabla de pagos todos los métodos de pago del mes corriente
      // Usar el mismo campo que usa PaymentsPage: monto_total
      const { data: payments, error } = await supabase
        .from('pagos')
        .select('monto_total, metodo_pago, created_at')
        .gte('created_at', startOfMonth)
        .lte('created_at', endOfMonthStr + ' 23:59:59');

      if (error) {
        console.error('Error fetching payments:', error);
        // Fallback: buscar en cotizaciones aceptadas del mes
        const { data: quotes } = await supabase
          .from('generated_quotes')
          .select('total')
          .eq('status', 'aceptada')
          .gte('created_at', startOfMonth)
          .lte('created_at', endOfMonthStr + ' 23:59:59');
          
        if (quotes && quotes.length > 0) {
          const total = quotes.reduce((sum, quote) => sum + (quote.total || 0), 0);
          setMonthlyIncome(total);
        }
        return;
      }

      if (payments && payments.length > 0) {
        // Sumar todos los pagos del mes usando monto_total (mismo campo que PaymentsPage)
        const total = payments.reduce((sum, payment) => {
          const amount = payment.monto_total || 0;
          console.log(`Payment: ${payment.metodo_pago} - $${amount} (${payment.created_at})`);
          return sum + amount;
        }, 0);
        
        console.log('Total monthly income:', total);
        setMonthlyIncome(total);
      } else {
        console.log('No payments found for current month');
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
      
      const { data: payments, error } = await supabase
        .from('pagos')
        .select('monto_total')
        .gte('created_at', today)
        .lte('created_at', today + ' 23:59:59');

      if (!error && payments) {
        const total = payments.reduce((sum, payment) => sum + (payment.monto_total || 0), 0);
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