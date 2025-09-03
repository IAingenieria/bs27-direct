import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, MessageSquare, Phone, Users, Car } from "lucide-react";

interface QuickActionsProps {
  onNewQuote?: () => void;
  onNewClient?: () => void;
  onNewVehicle?: () => void;
}

export function QuickActions({ onNewQuote, onNewClient, onNewVehicle }: QuickActionsProps) {
  const quickActions = [
    {
      title: "Nueva Cotización",
      description: "Crear cotización para cliente",
      icon: Plus,
      variant: "primary" as const,
      action: () => onNewQuote?.()
    },
    {
      title: "Nuevo Cliente",
      description: "Registrar cliente nuevo",
      icon: Users,
      variant: "success" as const,
      action: () => onNewClient?.()
    },
    {
      title: "Ingresar Vehículo",
      description: "Nueva orden de taller",
      icon: Car,
      variant: "warning" as const,
      action: () => onNewVehicle?.()
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {quickActions.map((action, index) => {
        const buttonVariants = {
          primary: "bg-gradient-gold hover:bg-gold/90 text-dark border border-gold/30",
          success: "bg-gradient-success hover:bg-success/90 text-white border border-success/30",
          warning: "bg-gradient-warning hover:bg-warning/90 text-white border border-warning/30",
          default: "bg-dark-light hover:bg-dark-light/80 text-gold border border-gold/30"
        };

        return (
          <Button
            key={index}
            variant="ghost"
            className={`h-auto p-4 flex flex-col items-center gap-2 transition-all duration-300 hover:scale-105 ${buttonVariants[action.variant]}`}
            onClick={action.action}
          >
            <action.icon className="h-6 w-6" />
            <div className="text-center">
              <p className="font-medium text-sm">{action.title}</p>
              <p className="text-xs opacity-80">{action.description}</p>
            </div>
          </Button>
        );
      })}
    </div>
  );
}