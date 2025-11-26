import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, Eye, Download, FileCode, Loader2, FileSpreadsheet, ImagePlus, Send, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { generateInvoicePDF } from "@/utils/pdfGenerator";
import { exportToCSV } from "@/utils/exportUtils";
import { InvoiceImageUpload } from "@/components/InvoiceImageUpload";
import { InvoicePreview } from "@/components/InvoicePreview";
import { InvoiceApprovalDialog } from "@/components/InvoiceApprovalDialog";
import { InvoiceStatusWorkflow } from "@/components/InvoiceStatusWorkflow";
import { SpvConfirmationDialog } from "@/components/SpvConfirmationDialog";
import { 
  validateProfileForEFactura, 
  validateClientForEFactura,
  validateInvoiceForEFactura,
  showValidationErrors 
} from "@/utils/xmlValidation";
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
  accountant_approved: boolean;
  approved_by?: string;
  approved_at?: string;
  approval_notes?: string;
  spv_sent_at?: string | null;
  clients: {
    name: string;
  };
}

const Invoices = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingPdf, setDownloadingPdf] = useState<Record<string, boolean>>({});
  const [downloadingXml, setDownloadingXml] = useState<Record<string, boolean>>({});
  const [sendingToSpv, setSendingToSpv] = useState<Record<string, boolean>>({});
  const [userRole, setUserRole] = useState<string | null>(null);
  const [workspaceOwnerId, setWorkspaceOwnerId] = useState<string | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [previewInvoice, setPreviewInvoice] = useState<any>(null);
  const [previewItems, setPreviewItems] = useState<any[]>([]);
  const [previewCompany, setPreviewCompany] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [approvingInvoice, setApprovingInvoice] = useState<Record<string, boolean>>({});
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [selectedInvoiceForApproval, setSelectedInvoiceForApproval] = useState<{
    id: string;
    number: string;
  } | null>(null);
  const [spvConfirmDialogOpen, setSpvConfirmDialogOpen] = useState(false);
  const [selectedInvoiceForSpv, setSelectedInvoiceForSpv] = useState<{ id: string; invoice_number: string } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.log("❌ No authenticated user");
      setLoading(false);
      return;
    }

    console.log("========================================");
    console.log("🔐 AUTHENTICATED USER ID:", user.id);
    console.log("📧 User email:", user.email);

    // Check if user is an accountant
    const { data: memberData, error: memberError } = await supabase
      .from("workspace_members")
      .select("role, workspace_owner_id, member_user_id")
      .eq("member_user_id", user.id)
      .maybeSingle();

    if (memberError) {
      console.error("❌ Error fetching workspace member:", memberError);
    }
    console.log("👥 WORKSPACE MEMBER DATA:", JSON.stringify(memberData, null, 2));

    // Explicitly check if role is 'accountant' from the enum
    const detectedRole = (memberData?.role === "accountant") ? "accountant" : "owner";
    console.log("🎭 DETECTED ROLE:", detectedRole);
    console.log("🎭 Role comparison:", {
      memberDataRole: memberData?.role,
      isAccountant: memberData?.role === "accountant",
      finalRole: detectedRole
    });
    
    setUserRole(detectedRole);
    console.log("✅ UserRole state set to:", detectedRole);
    
    // Store workspace owner ID if accountant
    let ownerIdToUse = null;
    if (detectedRole === "accountant" && memberData?.workspace_owner_id) {
      ownerIdToUse = memberData.workspace_owner_id;
      setWorkspaceOwnerId(ownerIdToUse);
      console.log("🏢 Workspace owner ID:", ownerIdToUse);
    }

    // Build query to get invoices
    let query = supabase
      .from("invoices")
      .select(`
        *,
        clients (
          name,
          cui_cif,
          email,
          phone,
          address,
          payment_terms
        )
      `)
      .order("created_at", { ascending: false });

    // If accountant, get invoices from workspace owner
    if (detectedRole === "accountant" && ownerIdToUse) {
      console.log("📊 Loading invoices for workspace owner:", ownerIdToUse);
      query = query.eq("user_id", ownerIdToUse);
    } else {
      // Otherwise, get user's own invoices
      console.log("📊 Loading invoices for user:", user.id);
      query = query.eq("user_id", user.id);
    }

    const { data, error } = await query;

    if (error) {
      console.error("❌ Error loading invoices:", error);
      toast.error("Eroare la încărcarea facturilor");
    } else {
      console.log(`📊 LOADED ${data?.length || 0} INVOICES for role: ${detectedRole}`);
      data?.forEach(inv => {
        console.log(`  - Invoice ${inv.invoice_number}: status=${inv.status}, approved=${inv.accountant_approved}`);
      });
      setInvoices(data || []);
    }
    console.log("========================================");
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
    setDownloadingPdf((prev) => ({ ...prev, [invoiceId]: true }));
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
      setDownloadingPdf((prev) => ({ ...prev, [invoiceId]: false }));
    }
  };

  const handleDownloadXML = async (invoiceId: string) => {
    setDownloadingXml((prev) => ({ ...prev, [invoiceId]: true }));
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Nu ești autentificat");
        setDownloadingXml(null);
        return;
      }

      // Fetch invoice and related data for validation
      const { data: invoiceData, error: invoiceError } = await supabase
        .from("invoices")
        .select(`
          *,
          clients (*)
        `)
        .eq("id", invoiceId)
        .single();

      if (invoiceError || !invoiceData) {
        throw new Error("Eroare la încărcarea datelor facturii");
      }

      // Fetch invoice items
      const { data: items, error: itemsError } = await supabase
        .from("invoice_items")
        .select("*")
        .eq("invoice_id", invoiceId);

      if (itemsError) {
        throw new Error("Eroare la încărcarea produselor/serviciilor");
      }

      // Fetch profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError || !profile) {
        throw new Error("Eroare la încărcarea profilului companiei");
      }

      // Validate profile
      const profileValidation = validateProfileForEFactura(profile);
      if (!profileValidation.isValid) {
        showValidationErrors(
          profileValidation.errors,
          "Date companie incomplete pentru e-Factura"
        );
        toast.info("Vă rugăm să completați datele companiei în Setări");
        setDownloadingXml(null);
        return;
      }

      // Validate client
      const clientValidation = validateClientForEFactura(invoiceData.clients);
      if (!clientValidation.isValid) {
        showValidationErrors(
          clientValidation.errors,
          "Date client incomplete pentru e-Factura"
        );
        toast.info("Vă rugăm să completați datele clientului");
        setDownloadingXml(null);
        return;
      }

      // Validate invoice
      const invoiceValidation = validateInvoiceForEFactura(invoiceData, items || []);
      if (!invoiceValidation.isValid) {
        showValidationErrors(
          invoiceValidation.errors,
          "Date factură incomplete pentru e-Factura"
        );
        setDownloadingXml(null);
        return;
      }

      // All validations passed, proceed with generation
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Nu ești autentificat");
        setDownloadingXml(null);
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
      setDownloadingXml((prev) => ({ ...prev, [invoiceId]: false }));
    }
  };

  const openApprovalDialog = (invoiceId: string, invoiceNumber: string) => {
    setSelectedInvoiceForApproval({ id: invoiceId, number: invoiceNumber });
    setApprovalDialogOpen(true);
  };

  const handleApproveInvoice = async (notes: string) => {
    if (!selectedInvoiceForApproval) return;
    
    setApprovingInvoice((prev) => ({ ...prev, [selectedInvoiceForApproval.id]: true }));
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('invoices')
        .update({
          accountant_approved: true,
          approved_by: user.id,
          approved_at: new Date().toISOString(),
          approval_notes: notes || null
        })
        .eq('id', selectedInvoiceForApproval.id);

      if (error) throw error;

      toast.success("Factură aprobată cu succes!");
      setApprovalDialogOpen(false);
      setSelectedInvoiceForApproval(null);
    loadData();
    } catch (error: any) {
      console.error("Error approving invoice:", error);
      toast.error(error.message || "Eroare la aprobarea facturii");
    } finally {
      setApprovingInvoice((prev) => ({ ...prev, [selectedInvoiceForApproval.id]: false }));
    }
  };

  const handleRejectInvoice = async (notes: string) => {
    if (!selectedInvoiceForApproval) return;
    
    setApprovingInvoice((prev) => ({ ...prev, [selectedInvoiceForApproval.id]: true }));
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('invoices')
        .update({
          accountant_approved: false,
          approved_by: null,
          approved_at: null,
          approval_notes: notes || "Factură respinsă de contabil",
          status: 'draft'
        })
        .eq('id', selectedInvoiceForApproval.id);

      if (error) throw error;

      toast.success("Factură respinsă. Proprietarul va fi notificat.");
      setApprovalDialogOpen(false);
      setSelectedInvoiceForApproval(null);
      loadData();
    } catch (error: any) {
      console.error("Error rejecting invoice:", error);
      toast.error(error.message || "Eroare la respingerea facturii");
    } finally {
      setApprovingInvoice((prev) => ({ ...prev, [selectedInvoiceForApproval.id]: false }));
    }
  };

  const handleSendToSPV = async (invoiceId: string, invoiceNumber: string) => {
    // Show confirmation dialog first
    setSelectedInvoiceForSpv({ id: invoiceId, invoice_number: invoiceNumber });
    setSpvConfirmDialogOpen(true);
  };

  const confirmSendToSPV = async () => {
    if (!selectedInvoiceForSpv) return;
    
    setSendingToSpv((prev) => ({ ...prev, [selectedInvoiceForSpv.id]: true }));
    
    try {
      const response = await supabase.functions.invoke("send-to-spv", {
        body: { invoiceId: selectedInvoiceForSpv.id },
      });

      if (response.error) {
        throw response.error;
      }

      if (response.data?.success) {
        // Update the invoice with SPV sent timestamp
        await supabase
          .from('invoices')
          .update({
            spv_sent_at: new Date().toISOString(),
            spv_status: 'sent'
          })
          .eq('id', selectedInvoiceForSpv.id);

        toast.success("Factură trimisă în SPV cu succes!");
        loadData();
      } else {
        throw new Error(response.data?.error || "Eroare necunoscută");
      }
    } catch (error: any) {
      console.error("Error sending to SPV:", error);
      toast.error(error.message || "Eroare la trimitere în SPV");
    } finally {
      setSendingToSpv((prev) => ({ ...prev, [selectedInvoiceForSpv.id]: false }));
      setSelectedInvoiceForSpv(null);
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

  const handlePreviewInvoice = async (invoiceId: string) => {
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

      setPreviewInvoice(invoice);
      setPreviewItems(items || []);
      setPreviewCompany(profile);
      setShowPreview(true);
    } catch (error) {
      console.error("Error loading preview:", error);
      toast.error("Eroare la încărcarea preview-ului");
    }
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
                  {invoice.accountant_approved && (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Aprobată
                    </Badge>
                  )}
                </div>
                </CardHeader>
                <CardContent>
                  {/* Status Workflow */}
                  <div className="mb-6">
                    <InvoiceStatusWorkflow
                      status={invoice.status}
                      accountantApproved={invoice.accountant_approved}
                      approvalNotes={invoice.approval_notes}
                      spvSentAt={invoice.spv_sent_at}
                    />
                  </div>

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
                        variant="ghost"
                        onClick={() => handlePreviewInvoice(invoice.id)}
                        title="Preview factură"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownloadPDF(invoice.id)}
                        disabled={downloadingPdf[invoice.id]}
                        title="Descarcă PDF"
                      >
                        {downloadingPdf[invoice.id] ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownloadXML(invoice.id)}
                        disabled={downloadingXml[invoice.id]}
                        title="Descarcă eFactura XML"
                      >
                        {downloadingXml[invoice.id] ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <FileCode className="h-4 w-4" />
                        )}
                       </Button>
                       {(() => {
                         const shouldShow = userRole === "accountant" && !invoice.accountant_approved && invoice.status === "sent";
                         console.log(`🔍🔍🔍 Invoice ${invoice.invoice_number} BUTTON CHECK:`, {
                           userRole: userRole,
                           userRoleType: typeof userRole,
                           accountant_approved: invoice.accountant_approved,
                           status: invoice.status,
                           condition1: userRole === "accountant",
                           condition2: !invoice.accountant_approved,
                           condition3: invoice.status === "sent",
                           shouldShow: shouldShow
                         });
                         return shouldShow;
                       })() && (
                         <Button
                           size="sm"
                           variant="default"
                           onClick={() => openApprovalDialog(invoice.id, invoice.invoice_number)}
                           disabled={approvingInvoice[invoice.id]}
                           title="Revizie factură"
                         >
                           {approvingInvoice[invoice.id] ? (
                             <Loader2 className="h-4 w-4 animate-spin" />
                           ) : (
                             <CheckCircle className="h-4 w-4" />
                           )}
                         </Button>
                       )}
                       {/* Send to SPV button - shows after accountant approval for both owners and accountants */}
                       {invoice.accountant_approved && invoice.status !== "paid" && (
                         <Button
                           size="sm"
                           variant="default"
                           onClick={() => handleSendToSPV(invoice.id, invoice.invoice_number)}
                           disabled={sendingToSpv[invoice.id]}
                           title="Trimite în SPV"
                           className="bg-green-600 hover:bg-green-700"
                         >
                           {sendingToSpv[invoice.id] ? (
                             <Loader2 className="h-4 w-4 animate-spin" />
                           ) : (
                             <Send className="h-4 w-4" />
                           )}
                         </Button>
                       )}
                     </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <InvoicePreview
          open={showPreview}
          onOpenChange={setShowPreview}
          invoice={previewInvoice}
          items={previewItems}
          company={previewCompany}
        />

        <InvoiceApprovalDialog
          open={approvalDialogOpen}
          onOpenChange={setApprovalDialogOpen}
          onApprove={handleApproveInvoice}
          onReject={handleRejectInvoice}
          invoiceNumber={selectedInvoiceForApproval?.number || ""}
          isLoading={selectedInvoiceForApproval ? approvingInvoice[selectedInvoiceForApproval.id] || false : false}
        />
        <SpvConfirmationDialog
          open={spvConfirmDialogOpen}
          onOpenChange={setSpvConfirmDialogOpen}
          onConfirm={confirmSendToSPV}
          invoiceNumber={selectedInvoiceForSpv?.invoice_number || ""}
        />
      </div>
    </DashboardLayout>
  );
};

export default Invoices;