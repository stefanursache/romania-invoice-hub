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
import { Download, FileText, Loader2 } from "lucide-react";
import { format } from "date-fns";

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
      toast.error("Please select a valid period");
      return;
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
        <div>
          <h1 className="text-3xl font-bold tracking-tight">SAF-T (D406) Export</h1>
          <p className="text-muted-foreground">
            Generate SAF-T XML files for ANAF submission
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
            <CardDescription>This information will be included in the SAF-T file</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Company Name:</span> {profile?.company_name || "N/A"}
              </div>
              <div>
                <span className="font-medium">CUI/CIF:</span> {profile?.cui_cif || "N/A"}
              </div>
              <div>
                <span className="font-medium">Reg. Com.:</span> {profile?.reg_com || "N/A"}
              </div>
              <div>
                <span className="font-medium">Address:</span> {profile?.address || "N/A"}
              </div>
              <div>
                <span className="font-medium">City:</span> {profile?.city || "N/A"}
              </div>
              <div>
                <span className="font-medium">Postal Code:</span> {profile?.postal_code || "N/A"}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Generate SAF-T Export</CardTitle>
            <CardDescription>
              Select the period for which to generate the SAF-T file. Automatic generation runs monthly on the 1st at 2 AM.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/50 p-4 rounded-lg text-sm space-y-2">
              <p className="font-medium">Required Chart of Accounts:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>4111 - Client Receivables (Creanțe clienți)</li>
                <li>707 - Revenue from Services/Products (Venituri)</li>
                <li>4427 - VAT Payable (TVA colectată)</li>
              </ul>
              <p className="text-xs text-muted-foreground mt-2">
                Make sure these accounts exist in your Chart of Accounts before generating SAF-T.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="periodType">Period Type</Label>
                <Select value={periodType} onValueChange={handlePeriodTypeChange}>
                  <SelectTrigger id="periodType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="month">Current Month</SelectItem>
                    <SelectItem value="quarter">Current Quarter</SelectItem>
                    <SelectItem value="year">Current Year</SelectItem>
                    <SelectItem value="custom">Custom Period</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="fromDate">From Date</Label>
                <Input
                  id="fromDate"
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="toDate">To Date</Label>
                <Input
                  id="toDate"
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                />
              </div>
            </div>

            <Button onClick={handleGenerate} disabled={generating} className="w-full md:w-auto">
              {generating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Generate SAF-T XML
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Previous Exports</CardTitle>
            <CardDescription>Download previously generated SAF-T files</CardDescription>
          </CardHeader>
          <CardContent>
            {exports.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No exports yet. Generate your first SAF-T export above.
              </p>
            ) : (
              <div className="space-y-2">
                {exports.map((exp) => (
                  <div
                    key={exp.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="space-y-1">
                      <p className="font-medium">
                        {format(new Date(exp.period_from), "dd MMM yyyy")} -{" "}
                        {format(new Date(exp.period_to), "dd MMM yyyy")}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Generated: {format(new Date(exp.generated_at), "dd MMM yyyy HH:mm")}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadExport(exp)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
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
