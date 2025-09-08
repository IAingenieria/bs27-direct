import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import Sidebar from "./Sidebar";

interface MainLayoutProps {
  children: ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const MainLayout = ({ children, activeTab, onTabChange }: MainLayoutProps) => {
  return (
    <div className="min-h-screen bg-dark flex">
      <Sidebar activeTab={activeTab} onTabChange={onTabChange} />
      
      {/* Main Content */}
      <main className="flex-1 lg:ml-0 h-screen overflow-hidden">
        <div className="max-w-7xl mx-auto p-6 h-full overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
