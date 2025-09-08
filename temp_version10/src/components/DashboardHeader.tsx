import { Bell, Settings, User, Car } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function DashboardHeader() {
  const notifications = 5; // This would come from state/API

  return (
    <header className="bg-card border-b border-border sticky top-0 z-40">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <Car className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">BS27 Garage</h1>
              <p className="text-xs text-muted-foreground">Sistema de Gestión</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            {notifications > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
              >
                {notifications}
              </Badge>
            )}
          </Button>
          
          <Button variant="ghost" size="icon">
            <Settings className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                BS
              </AvatarFallback>
            </Avatar>
            <div className="hidden sm:block">
              <p className="text-sm font-medium">Admin</p>
              <p className="text-xs text-muted-foreground">Propietario</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}