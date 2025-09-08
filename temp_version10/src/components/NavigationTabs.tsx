import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Car, 
  DollarSign, 
  Bell,
  Calendar
} from "lucide-react";

interface NavigationTabsProps {
  activeTab: string;
  onTabChange: (value: string) => void;
}

const navigationItems = [
  {
    value: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    badge: null
  },
  {
    value: "notifications",
    label: "Notificaciones",
    icon: Bell,
    badge: 5
  },
  {
    value: "quotes",
    label: "Cotizaciones",
    icon: FileText,
    badge: null
  },
  {
    value: "customers",
    label: "Clientes",
    icon: Users,
    badge: null
  },
  {
    value: "vehicles",
    label: "Vehículos",
    icon: Car,
    badge: 3
  },
  {
    value: "payments",
    label: "Pagos",
    icon: DollarSign,
    badge: null
  },
  {
    value: "calendar",
    label: "Agenda",
    icon: Calendar,
    badge: null
  }
];

export function NavigationTabs({ activeTab, onTabChange }: NavigationTabsProps) {
  return (
    <div className="bg-card border-b border-border px-6 py-4">
      <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-7 bg-muted/50">
          {navigationItems.map((item) => (
            <TabsTrigger 
              key={item.value} 
              value={item.value}
              className="relative flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <item.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{item.label}</span>
              {item.badge && (
                <Badge 
                  variant="destructive" 
                  className="ml-1 h-4 w-4 rounded-full p-0 flex items-center justify-center text-xs"
                >
                  {item.badge}
                </Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
}