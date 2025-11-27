import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface ResponsiveTableProps {
  children: ReactNode;
  className?: string;
}

export function ResponsiveTable({ children, className = "" }: ResponsiveTableProps) {
  return (
    <div className={`w-full ${className}`}>
      {/* Desktop view - regular table */}
      <div className="hidden md:block overflow-x-auto">
        <div className="inline-block min-w-full align-middle">
          {children}
        </div>
      </div>
      
      {/* Mobile view - scrollable with shadow hint */}
      <div className="md:hidden">
        <div className="overflow-x-auto pb-4 -mx-4 px-4 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
          <div className="inline-block min-w-full align-middle">
            {children}
          </div>
        </div>
        <p className="text-xs text-center text-muted-foreground mt-2">
          ← Derulează lateral pentru mai multe detalii →
        </p>
      </div>
    </div>
  );
}
