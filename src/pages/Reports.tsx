import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Download, FileText, Loader2, AlertCircle, CheckCircle2, Calendar, Shield } from "lucide-react";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { Link } from "react-router-dom";
import { 
  validateProfileForSaftExport, 
  validateRequiredAccountsForSaft,
  showValidationErrors 
} from "@/utils/xmlValidation";
import { SaftStatusWidget } from "@/components/SaftStatusWidget";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface Profile {
  company_name: string;
  cui_cif: string;
  reg_com: string;
  address: string;
  city: string;
  postal_code: string;
  country: string;
}

interface SaftExport {
  id: string;
  period_from: string;
  period_to: string;
  generated_at: string;
  status: string;
  file_data: string;
}

const Reports = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [exports, setExports] = useState<SaftExport[]>([]);
  
  const [periodType, setPeriodType] = useState<string>("month");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    await loadData(user.id);
  };

  const loadData = async (userId: string) => {
    setLoading(true);
    try {
      console.log("Reports: Loading data for user:", userId);
      
      // Load profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      console.log("Reports: Profile data:", profileData);
      console.log("Reports: Profile error:", profileError);

      if (profileError) throw profileError;
      
      if (!profileData) {
        console.warn("Reports: No profile found for user");
        toast.error("Profile not found. Please update your profile in Settings.");
      }
      
      setProfile(profileData);

      // Load previous exports
      const { data: exportsData, error: exportsError } = await supabase
        .from("saft_exports")
        .select("*")
        .eq("user_id", userId)
        .order("generated_at", { ascending: false });

      console.log("Reports: Exports data:", exportsData?.length || 0);
      console.log("Reports: Exports error:", exportsError);

      if (exportsError) throw exportsError;
      setExports(exportsData || []);
    } catch (error) {
      console.error("Reports: Error loading data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handlePeriodTypeChange = (value: string) => {
    setPeriodType(value);
    const today = new Date();
    let from = new Date();
    let to = today;

    switch (value) {
      case "month":
        from = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case "quarter":
        const quarter = Math.floor(today.getMonth() / 3);
        from = new Date(today.getFullYear(), quarter * 3, 1);
        break;
      case "year":
        from = new Date(today.getFullYear(), 0, 1);
        break;
      case "custom":
        return;
    }

    setFromDate(format(from, "yyyy-MM-dd"));
    setToDate(format(to, "yyyy-MM-dd"));
  };

  const handleGenerate = async () => {
    if (!fromDate || !toDate) {
      toast.error("Vă rugăm să selectați perioada pentru raport");
      return;
    }

    // Validate profile data
    const profileValidation = validateProfileForSaftExport(profile);
    if (!profileValidation.isValid) {
      showValidationErrors(
        profileValidation.errors,
        "Date companie incomplete pentru SAF-T"
      );
      toast.info("Vă rugăm să completați datele companiei în Setări înainte de a genera raportul SAF-T");
      return;
    }

    // Validate required accounts
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: accounts } = await supabase
        .from("accounts")
        .select("account_code")
        .eq("user_id", user.id);

      if (accounts) {
        const accountsValidation = validateRequiredAccountsForSaft(accounts);
        if (!accountsValidation.isValid) {
          showValidationErrors(
            accountsValidation.errors,
            "Conturi contabile lipsă pentru SAF-T"
          );
          toast.info("Vă rugăm să adăugați conturile obligatorii în Plan de conturi");
          return;
        }
      }
    }

    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-saft-xml", {
        body: { periodFrom: fromDate, periodTo: toDate },
      });

      if (error) throw error;

      if (data.error) {
        // Check if it's a validation error about missing accounts
        if (data.error.includes("Missing required Romanian standard accounts")) {
          toast.error(data.error, { duration: 6000 });
        } else {
          toast.error(data.error);
        }
        return;
      }

      if (data.success) {
        toast.success("SAF-T XML generated successfully");
        
        // Download the file
        const blob = new Blob([data.xml], { type: "application/xml" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `SAFT-D406_${fromDate}_${toDate}.xml`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        // Reload exports
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await loadData(user.id);
        }
      }
    } catch (error) {
      console.error("Error generating SAF-T:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to generate SAF-T XML";
      
      if (errorMessage.includes("Missing required Romanian standard accounts")) {
        toast.error(errorMessage, { duration: 6000 });
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadExport = (exportItem: SaftExport) => {
    const blob = new Blob([exportItem.file_data], { type: "application/xml" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `SAFT-D406_${exportItem.period_from}_${exportItem.period_to}.xml`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Rapoarte</h1>
            <p className="text-muted-foreground">
              Generați rapoarte SAF-T XML pentru ANAF
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              Generare automată: Zilnic la ora 2:00 AM
            </div>
            <Link to="/saft-validator">
              <Button variant="outline">
                <Shield className="h-4 w-4 mr-2" />
                Validare SAF-T
              </Button>
            </Link>
          </div>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Informație importantă</AlertTitle>
          <AlertDescription>
            Pentru a genera rapoarte SAF-T valide, asigurați-vă că aveți toate datele companiei completate în Setări
            și conturile obligatorii adăugate în Planul de conturi.
          </AlertDescription>
        </Alert>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <CardTitle>Informații Companie</CardTitle>
                </div>
                <CardDescription>Aceste informații vor fi incluse în fișierul SAF-T</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Nume Companie</p>
                    <p className="font-medium">{profile?.company_name || "Necompletat"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">CUI/CIF</p>
                    <p className="font-medium">{profile?.cui_cif || "Necompletat"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Reg. Com.</p>
                    <p className="font-medium">{profile?.reg_com || "Necompletat"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Oraș</p>
                    <p className="font-medium">{profile?.city || "Necompletat"}</p>
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <p className="text-xs text-muted-foreground">Adresă</p>
                    <p className="font-medium">{profile?.address || "Necompletat"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <CardTitle>Generare Export SAF-T</CardTitle>
                </div>
                <CardDescription>
                  Selectați perioada pentru care doriți să generați fișierul SAF-T
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert className="bg-muted/50 border-primary/20">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Conturi obligatorii în Planul de conturi</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc list-inside space-y-1 mt-2 text-sm">
                      <li><strong>4111</strong> - Creanțe clienți</li>
                      <li><strong>707</strong> - Venituri din servicii/produse</li>
                      <li><strong>4427</strong> - TVA colectată</li>
                    </ul>
                  </AlertDescription>
                </Alert>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="periodType">Tip Perioadă</Label>
                    <Select value={periodType} onValueChange={handlePeriodTypeChange}>
                      <SelectTrigger id="periodType">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="month">Luna curentă</SelectItem>
                        <SelectItem value="quarter">Trimestrul curent</SelectItem>
                        <SelectItem value="year">Anul curent</SelectItem>
                        <SelectItem value="custom">Perioadă personalizată</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="fromDate">De la data</Label>
                    <Input
                      id="fromDate"
                      type="date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="toDate">Până la data</Label>
                    <Input
                      id="toDate"
                      type="date"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                    />
                  </div>
                </div>

                <Button onClick={handleGenerate} disabled={generating} className="w-full">
                  {generating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Se generează...
                    </>
                  ) : (
                    <>
                      <FileText className="mr-2 h-4 w-4" />
                      Generează SAF-T XML
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <SaftStatusWidget exports={exports} onDownload={handleDownloadExport} />
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Istoric Exporturi</CardTitle>
            <CardDescription>Descărcați fișierele SAF-T generate anterior</CardDescription>
          </CardHeader>
          <CardContent>
            {exports.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Nu există exporturi generate încă
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Generați primul dvs. export SAF-T mai sus
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {exports.map((exp) => (
                  <div
                    key={exp.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div className="space-y-1">
                        <p className="font-medium">
                          {format(new Date(exp.period_from), "dd MMM yyyy", { locale: ro })} -{" "}
                          {format(new Date(exp.period_to), "dd MMM yyyy", { locale: ro })}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Generat: {format(new Date(exp.generated_at), "dd MMM yyyy HH:mm", { locale: ro })}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadExport(exp)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Descarcă
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Reports;
