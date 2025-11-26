import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, Eye, Download, FileCode, Loader2, FileSpreadsheet, ImagePlus } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { generateInvoicePDF } from "@/utils/pdfGenerator";
import { exportToCSV } from "@/utils/exportUtils";
import { InvoiceImageUpload } from "@/components/InvoiceImageUpload";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

interface Invoice {
  id: string;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  status: string;
  subtotal: number;
  vat_amount: number;
  total: number;
  currency: string;
  invoice_type: string;
  clients: {
    name: string;
  };
}

const Invoices = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingPdf, setDownloadingPdf] = useState<string | null>(null);
  const [downloadingXml, setDownloadingXml] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>("owner");
  const [showUploadDialog, setShowUploadDialog] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Check if user is an accountant
    const { data: memberData } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("member_user_id", user.id)
      .maybeSingle();

    setUserRole(memberData?.role || "owner");
    loadInvoices();
  };

  const loadInvoices = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("invoices")
      .select(`
        *,
        clients (
          name
        )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Eroare la încărcarea facturilor");
      console.error(error);
    } else {
      setInvoices(data || []);
    }
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-success text-white";
      case "sent":
        return "bg-primary text-primary-foreground";
      case "overdue":
        return "bg-destructive text-destructive-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "draft":
        return "Ciornă";
      case "sent":
        return "Trimisă";
      case "paid":
        return "Plătită";
      case "overdue":
        return "Restanță";
      default:
        return status;
    }
  };

  const handleDownloadPDF = async (invoiceId: string) => {
    setDownloadingPdf(invoiceId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch invoice with all data
      const { data: invoice, error: invoiceError } = await supabase
        .from("invoices")
        .select(`
          *,
          clients (
            name,
            cui_cif,
            reg_com,
            address,
            email,
            phone
          )
        `)
        .eq("id", invoiceId)
        .single();

      if (invoiceError || !invoice) {
        toast.error("Eroare la încărcarea facturii");
        return;
      }

      // Fetch invoice items
      const { data: items, error: itemsError } = await supabase
        .from("invoice_items")
        .select("*")
        .eq("invoice_id", invoiceId);

      if (itemsError) {
        toast.error("Eroare la încărcarea liniilor");
        return;
      }

      // Fetch user profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError || !profile) {
        toast.error("Eroare la încărcarea profilului");
        return;
      }

      // Generate PDF
      generateInvoicePDF(
        {
          ...invoice,
          subtotal: Number(invoice.subtotal),
          vat_amount: Number(invoice.vat_amount),
          total: Number(invoice.total),
          client: invoice.clients,
          items: items.map((item) => ({
            description: item.description,
            quantity: Number(item.quantity),
            unit_price: Number(item.unit_price),
            vat_rate: item.vat_rate,
            subtotal: Number(item.subtotal),
            vat_amount: Number(item.vat_amount),
            total: Number(item.total),
          })),
        },
        profile
      );

      toast.success("PDF descărcat!");
    } catch (error: any) {
      toast.error("Eroare la generare PDF");
      console.error(error);
    } finally {
      setDownloadingPdf(null);
    }
  };

  const handleDownloadXML = async (invoiceId: string) => {
    setDownloadingXml(invoiceId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Nu ești autentificat");
        return;
      }

      const response = await supabase.functions.invoke("generate-efactura-xml", {
        body: { invoiceId },
      });

      if (response.error) {
        throw response.error;
      }

      // Create blob and download
      const blob = new Blob([response.data], { type: "application/xml" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `eFactura-${invoiceId}.xml`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("XML eFactura descărcat!");
    } catch (error: any) {
      toast.error("Eroare la generare XML");
      console.error(error);
    } finally {
      setDownloadingXml(null);
    }
  };

  const handleExportCSV = () => {
    const exportData = invoices.map((invoice) => ({
      invoice_type: invoice.invoice_type === "proforma" ? "Pro Forma" : "Factură Fiscală",
      invoice_number: invoice.invoice_number,
      issue_date: invoice.issue_date,
      due_date: invoice.due_date,
      client_name: invoice.clients?.name || "Unknown",
      status: invoice.status,
      subtotal: Number(invoice.subtotal),
      vat_amount: Number(invoice.vat_amount),
      total: Number(invoice.total),
      currency: invoice.currency || "RON",
    }));

    exportToCSV(exportData, `invoices_${new Date().toISOString().split('T')[0]}.csv`);
    toast.success("Facturi exportate în CSV!");
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Facturi</h1>
            <p className="text-muted-foreground">Gestionează facturile tale</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportCSV}>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            {userRole === "owner" && (
              <>
                <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <ImagePlus className="mr-2 h-4 w-4" />
                      Import din imagine
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <InvoiceImageUpload />
                  </DialogContent>
                </Dialog>
                <Link to="/invoices/new">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Factură nouă
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>

        {invoices.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground mb-4">Nu ai facturi încă</p>
              <Link to="/invoices/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Creează prima factură
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {invoices.map((invoice) => (
              <Card key={invoice.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-xl">
                        {invoice.invoice_type === "proforma" ? "Proformă" : "Factură"} #{invoice.invoice_number}
                      </CardTitle>
                      {invoice.invoice_type === "proforma" && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                          PRO FORMA
                        </Badge>
                      )}
                    </div>
                    <Badge className={getStatusColor(invoice.status)}>
                      {getStatusLabel(invoice.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Client</p>
                      <p className="font-medium">{invoice.clients.name}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Data emiterii</p>
                      <p className="font-medium">
                        {new Date(invoice.issue_date).toLocaleDateString("ro-RO")}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Scadență</p>
                      <p className="font-medium">
                        {new Date(invoice.due_date).toLocaleDateString("ro-RO")}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Total</p>
                      <p className="text-xl font-bold">
                        {invoice.total.toFixed(2)} {invoice.currency}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownloadPDF(invoice.id)}
                        disabled={downloadingPdf === invoice.id}
                      >
                        {downloadingPdf === invoice.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownloadXML(invoice.id)}
                        disabled={downloadingXml === invoice.id}
                        title="Descarcă eFactura XML"
                      >
                        {downloadingXml === invoice.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <FileCode className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Invoices;