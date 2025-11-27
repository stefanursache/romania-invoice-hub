import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, AlertTriangle, Crown } from "lucide-react";
import { Link } from "react-router-dom";
import { usePlanLimits } from "@/hooks/usePlanLimits";

export const InvoiceUsageWidget = () => {
  const { limits, loading } = usePlanLimits();

  if (loading || !limits) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="h-32 animate-pulse bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  const isNearLimit = limits.usagePercentage >= 80;
  const isAtLimit = !limits.canCreateInvoice;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Utilizare Facturi</CardTitle>
          </div>
          <Badge variant={isAtLimit ? "destructive" : isNearLimit ? "default" : "secondary"} className="capitalize">
            Plan {limits.plan}
          </Badge>
        </div>
        <CardDescription>
          {limits.invoicesThisMonth} din {limits.invoiceLimit === Infinity ? "∞" : limits.invoiceLimit} facturi folosite luna aceasta
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progres lunar</span>
            <span className="font-medium">
              {limits.invoiceLimit === Infinity ? "Nelimitat" : `${Math.min(limits.usagePercentage, 100).toFixed(0)}%`}
            </span>
          </div>
          <Progress 
            value={Math.min(limits.usagePercentage, 100)} 
            className="h-2"
          />
        </div>

        {isAtLimit && (
          <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-destructive">Limită atinsă</p>
              <p className="text-xs text-muted-foreground">
                Ai atins limita de facturi pentru planul {limits.plan}. Actualizează planul pentru a continua.
              </p>
            </div>
          </div>
        )}

        {!isAtLimit && isNearLimit && (
          <div className="flex items-start gap-2 p-3 bg-warning/10 border border-warning/20 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-warning mt-0.5 shrink-0" />
            <div className="space-y-1">
              <p className="text-sm font-medium">Aproape de limită</p>
              <p className="text-xs text-muted-foreground">
                Mai poți crea {limits.invoiceLimit - limits.invoicesThisMonth} facturi luna aceasta.
              </p>
            </div>
          </div>
        )}

        {limits.plan !== "enterprise" && (
          <Link to="/pricing">
            <Button variant="outline" className="w-full" size="sm">
              <Crown className="h-4 w-4 mr-2" />
              Actualizează Planul
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  );
};
