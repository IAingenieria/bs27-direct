import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'default' | 'success' | 'warning' | 'destructive';
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  urgent?: boolean;
}

const variantConfig = {
  default: {
    bg: "bg-gradient-card shadow-card",
    iconBg: "bg-gold/20",
    iconColor: "text-gold",
    border: "border-gold/20",
    textColor: "text-foreground"
  },
  success: {
    bg: "bg-gradient-success shadow-success",
    iconBg: "bg-white/20",
    iconColor: "text-white",
    border: "border-success/30",
    textColor: "text-white"
  },
  warning: {
    bg: "bg-gradient-warning shadow-warning",
    iconBg: "bg-white/20",
    iconColor: "text-white",
    border: "border-warning/30",
    textColor: "text-white"
  },
  destructive: {
    bg: "bg-gradient-danger shadow-danger",
    iconBg: "bg-white/20",
    iconColor: "text-white",
    border: "border-danger/30",
    textColor: "text-white"
  }
};

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'default',
  trend = 'neutral',
  trendValue,
  urgent = false
}: MetricCardProps) {
  const config = variantConfig[variant];

  return (
    <Card 
      className={cn(
        "relative overflow-hidden transition-all duration-300 hover:shadow-card-hover",
        config.bg,
        config.border,
        urgent && "animate-pulse-glow ring-2 ring-destructive/20"
      )}
    >
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className={cn(
              "text-sm font-medium mb-2",
              variant === 'default' ? "text-muted-foreground" : "text-white/80"
            )}>
              {title}
            </p>
            <div className="space-y-1">
              <h3 className={cn(
                "text-2xl font-bold",
                config.textColor || "text-foreground"
              )}>
                {value}
              </h3>
              {subtitle && (
                <p className={cn(
                  "text-sm",
                  variant === 'default' ? "text-muted-foreground" : "text-white/70"
                )}>
                  {subtitle}
                </p>
              )}
              {trendValue && (
                <div className={cn(
                  "flex items-center gap-1 text-xs font-medium",
                  variant === 'default' && trend === 'up' && "text-success",
                  variant === 'default' && trend === 'down' && "text-warning",
                  variant === 'default' && trend === 'neutral' && "text-muted-foreground",
                  variant !== 'default' && "text-white/90"
                )}>
                  {trend === 'up' && '↗'}
                  {trend === 'down' && '↘'}
                  {trend === 'neutral' && '→'}
                  <span>{trendValue}</span>
                </div>
              )}
            </div>
          </div>
          <div className={cn(
            "p-3 rounded-lg",
            config.iconBg
          )}>
            <Icon className={cn("h-6 w-6", config.iconColor)} />
          </div>
        </div>
      </div>
      
      {urgent && (
        <div className="absolute -top-1 -right-1 h-3 w-3 bg-destructive rounded-full animate-ping" />
      )}
    </Card>
  );
}