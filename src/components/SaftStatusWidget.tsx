import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Calendar, Download, ArrowRight, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

interface SaftExport {
  id: string;
  period_from: string;
  period_to: string;
  generated_at: string;
  status: string;
  file_data: string;
}

interface SaftStatusWidgetProps {
  exports?: SaftExport[];
  onDownload?: (exportItem: SaftExport) => void;
}

export const SaftStatusWidget = ({ exports: propExports, onDownload: propOnDownload }: SaftStatusWidgetProps = {}) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(!propExports);
  const [internalExports, setInternalExports] = useState<SaftExport[]>([]);

  useEffect(() => {
    if (!propExports) {
      loadLatestExport();
    }
  }, [propExports]);

  const loadLatestExport = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("saft_exports")
        .select("*")
        .eq("user_id", user.id)
        .order("generated_at", { ascending: false })
        .limit(1);

      if (error && error.code !== "PGRST116") {
        console.error("Error loading latest SAF-T export:", error);
        return;
      }

      setInternalExports(data || []);
    } catch (error) {
      console.error("Error loading latest SAF-T export:", error);
    } finally {
      setLoading(false);
    }
  };

  const exports = propExports || internalExports;
  const latestExport = exports[0] || null;

  const handleDownload = (exportItem: SaftExport) => {
    if (propOnDownload) {
      propOnDownload(exportItem);
    } else {
      // Default download behavior
      const blob = new Blob([exportItem.file_data], { type: "application/xml" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `SAFT-D406_${exportItem.period_from}_${exportItem.period_to}.xml`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            SAF-T Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!latestExport) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                SAF-T Status
              </CardTitle>
              <CardDescription>Ultimul export generat</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-sm text-muted-foreground">
              Nu există exporturi generate încă
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Primul raport va fi generat automat
            </p>
          </div>
          <Button 
            onClick={() => navigate("/reports")} 
            variant="outline" 
            className="w-full"
            size="sm"
          >
            Generează manual
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              SAF-T Status
            </CardTitle>
            <CardDescription>Ultimul export generat</CardDescription>
          </div>
          <Badge variant={latestExport.status === "generated" ? "default" : "secondary"}>
            {latestExport.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-start gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Perioada</p>
                <p className="font-medium">
                  {format(new Date(latestExport.period_from), "dd MMM", { locale: ro })} -{" "}
                  {format(new Date(latestExport.period_to), "dd MMM yyyy", { locale: ro })}
                </p>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Generat la</p>
              <p className="font-medium">
                {format(new Date(latestExport.generated_at), "dd MMM yyyy", { locale: ro })}
              </p>
              <p className="text-xs text-muted-foreground">
                {format(new Date(latestExport.generated_at), "HH:mm", { locale: ro })}
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDownload(latestExport)}
              className="w-full"
            >
              <Download className="h-4 w-4 mr-2" />
              Descarcă ultimul export
            </Button>
            {!propExports && (
              <Button 
                onClick={() => navigate("/reports")} 
                variant="ghost" 
                className="w-full"
                size="sm"
              >
                Vezi toate rapoartele
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
