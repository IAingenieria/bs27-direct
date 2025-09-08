import { Toaster } from "@/components/ui/toaster";
import VehiclesPage from "./components/VehiclesPage";
import { VehicleDetailsPage } from "./components/VehicleDetailsPage";
import CalendarPage from "./components/CalendarPage";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import CheckTable from "./pages/CheckTable";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/vehiculos" element={<VehiclesPage />} />
          <Route path="/vehiculos/:vehicleId" element={<VehicleDetailsPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          {/* Temporary route for debugging - remove after use */}
          <Route path="/check-table" element={<CheckTable />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
