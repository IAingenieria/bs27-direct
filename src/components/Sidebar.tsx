import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Bell, 
  FileText, 
  Users, 
  Car, 
  Calendar,
  Settings,
  User,
  Menu,
  X
} from "lucide-react";

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Sidebar = ({ activeTab, onTabChange }: SidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const navigationItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      route: "/",
    },
    {
      id: "notifications",
      label: "Notificaciones",
      icon: Bell,
      route: null, // Tab-based navigation
    },
    {
      id: "quotes",
      label: "Cotizaciones",
      icon: FileText,
      route: null, // Tab-based navigation
    },
    {
      id: "clients",
      label: "Clientes",
      icon: Users,
      route: null, // Tab-based navigation
    },
    {
      id: "vehicles",
      label: "Vehículos",
      icon: Car,
      route: "/vehiculos",
    },
    {
      id: "calendar",
      label: "Agenda",
      icon: Calendar,
      route: "/calendar",
    },
  ];

  const bottomItems = [
    {
      id: "settings",
      label: "Configuración",
      icon: Settings,
    },
    {
      id: "profile",
      label: "Perfil",
      icon: User,
    },
  ];

  const handleItemClick = (itemId: string) => {
    onTabChange(itemId);
    setIsMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile Toggle Button */}
      <Button
        variant="ghost"
        size="sm"
        className="fixed top-4 left-4 z-50 lg:hidden"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 bg-dark-light shadow-2xl transition-all duration-300 ease-in-out border-r border-gold/20",
          "flex flex-col",
          // Desktop states
          "lg:relative lg:translate-x-0",
          isCollapsed ? "lg:w-20" : "lg:w-72",
          // Mobile states
          "lg:block",
          isMobileOpen ? "translate-x-0 w-72" : "-translate-x-full w-72 lg:translate-x-0"
        )}
      >
        {/* Header */}
        <div className="p-4 border-b border-gold/20">
          <div className="flex items-center justify-between">
            {!isCollapsed && (
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 flex items-center justify-center">
                  <img 
                    src="/bs27-logo.png" 
                    alt="BS27 Garage" 
                    className="w-10 h-10 bs27-logo"
                  />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gold">BS27 Garage</h1>
                  <p className="text-xs text-gold/70">Premium Bodyshop</p>
                </div>
              </div>
            )}
            {isCollapsed && (
              <div className="w-12 h-12 flex items-center justify-center mx-auto">
                <img 
                  src="/bs27-logo.png" 
                  alt="BS27 Garage" 
                  className="w-8 h-8 bs27-logo"
                />
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="hidden lg:flex h-8 w-8 p-0 text-gold hover:bg-gold/10"
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              <Menu className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.route 
              ? location.pathname === item.route || location.pathname.startsWith(item.route + '/')
              : activeTab === item.id;
            
            const handleClick = () => {
              if (item.route) {
                navigate(item.route);
              } else {
                onTabChange(item.id);
              }
            };
            
            return (
              <button
                key={item.id}
                onClick={handleClick}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  "hover:bg-gold/10 hover:text-gold",
                  isActive 
                    ? "bg-gradient-gold text-dark shadow-gold" 
                    : "text-muted-foreground"
                )}
              >
                <Icon className={cn("h-5 w-5", !isCollapsed && "mr-3")} />
                {!isCollapsed && (
                  <span className="font-medium">{item.label}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="p-4 border-t border-gold/20 space-y-2">
          {bottomItems.map((item) => {
            const Icon = item.icon;
            
            return (
              <Button
                key={item.id}
                variant="ghost"
                className={cn(
                  "w-full justify-start h-11 px-3",
                  "hover:bg-gold/10 hover:text-gold",
                  "text-muted-foreground",
                  isCollapsed && "justify-center px-0"
                )}
                onClick={() => handleItemClick(item.id)}
              >
                <Icon className={cn("h-5 w-5", !isCollapsed && "mr-3")} />
                {!isCollapsed && (
                  <span className="font-medium">{item.label}</span>
                )}
              </Button>
            );
          })}
          
          {/* Logo at bottom */}
          <div className="mt-6 pt-4 border-t border-gold/20 flex justify-center">
            <div className="flex items-center justify-center">
              <img 
                src="/bs27-logo.png" 
                alt="BS27 Garage" 
                className={cn(
                  "bs27-logo opacity-70 hover:opacity-100 transition-opacity",
                  isCollapsed ? "w-20" : "w-32"
                )}
              />
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
