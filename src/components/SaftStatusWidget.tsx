import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, CheckCircle2, XCircle, Clock, ArrowRight, Calendar } from "lucide-react";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

interface SaftExport {
  id: string;
  period_from: string;
  period_to: string;
  generated_at: string;
  status: string;
}

export const SaftStatusWidget = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [latestExport, setLatestExport] = useState<SaftExport | null>(null);

  useEffect(() => {
    loadLatestExport();
  }, []);

  const loadLatestExport = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("saft_exports")
        .select("*")
        .eq("user_id", user.id)
        .order("generated_at", { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error loading latest SAF-T export:", error);
        return;
      }

      setLatestExport(data || null);
    } catch (error) {
      console.error("Error loading latest SAF-T export:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "generated":
        return {
          icon: CheckCircle2,
          color: "text-green-600",
          bgColor: "bg-green-50 dark:bg-green-950",
          label: "Generat cu succes",
          variant: "default" as const,
        };
      case "failed":
        return {
          icon: XCircle,
          color: "text-destructive",
          bgColor: "bg-destructive/10",
          label: "Eșuat",
          variant: "destructive" as const,
        };
      default:
        return {
          icon: Clock,
          color: "text-muted-foreground",
          bgColor: "bg-muted",
          label: "În așteptare",
          variant: "secondary" as const,
        };
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Status SAF-T (D406)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Clock className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!latestExport) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Status SAF-T (D406)
          </CardTitle>
          <CardDescription>
            Generare automată lunară pe data de 1
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-8">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground text-sm">
              Niciun raport SAF-T generat încă
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Primul raport va fi generat automat luna viitoare
            </p>
          </div>
          <Button 
            onClick={() => navigate("/reports")} 
            variant="outline" 
            className="w-full"
          >
            Generează manual
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  const statusInfo = getStatusInfo(latestExport.status);
  const StatusIcon = statusInfo.icon;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Status SAF-T (D406)
        </CardTitle>
        <CardDescription>
          Ultimul raport generat automat
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className={`flex items-center justify-between p-4 rounded-lg ${statusInfo.bgColor}`}>
          <div className="flex items-center gap-3">
            <StatusIcon className={`h-6 w-6 ${statusInfo.color}`} />
            <div>
              <p className="font-medium">{statusInfo.label}</p>
              <div className="flex items-center gap-2 mt-1">
                <Calendar className="h-3 w-3 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">
                  {format(new Date(latestExport.period_from), "dd MMM", { locale: ro })} -{" "}
                  {format(new Date(latestExport.period_to), "dd MMM yyyy", { locale: ro })}
                </p>
              </div>
            </div>
          </div>
          <Badge variant={statusInfo.variant}>
            {latestExport.status === "generated" ? "Activ" : "Eșec"}
          </Badge>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span>Data generare:</span>
            <span className="font-medium text-foreground">
              {format(new Date(latestExport.generated_at), "dd MMM yyyy, HH:mm", { locale: ro })}
            </span>
          </div>
          <div className="flex items-center justify-between text-muted-foreground">
            <span>Următoarea generare:</span>
            <span className="font-medium text-foreground">
              1 {format(new Date().setMonth(new Date().getMonth() + 1), "MMM yyyy", { locale: ro })}
            </span>
          </div>
        </div>

        <Button 
          onClick={() => navigate("/reports")} 
          variant="outline" 
          className="w-full"
        >
          Vezi toate rapoartele
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
};
