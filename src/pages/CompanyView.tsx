import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Building2, FileText, Receipt, BarChart3, BookOpen, Download, Eye, User, FileDown, FileSpreadsheet } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface Profile {
  company_name: string;
  cui_cif: string | null;
  reg_com: string | null;
  address: string | null;
  city: string | null;
  county: string | null;
  country: string | null;
  postal_code: string | null;
  phone: string | null;
  email: string | null;
  bank_account: string | null;
}

interface Invoice {
  id: string;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  status: string;
  total: number;
  currency: string;
  clients: { name: string };
}

interface Expense {
  id: string;
  expense_date: string;
  merchant: string;
  category: string;
  amount: number;
  vat_amount: number;
  currency: string;
  status: string;
  description: string | null;
  notes: string | null;
  image_url: string | null;
}

interface SaftExport {
  id: string;
  period_from: string;
  period_to: string;
  generated_at: string;
  status: string;
  file_data: string;
}

interface Account {
  id: string;
  account_code: string;
  account_name: string;
  account_type: string | null;
}

const CompanyView = () => {
  const navigate = useNavigate();
  const { companyId } = useParams();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [saftExports, setSaftExports] = useState<SaftExport[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [generatingSaft, setGeneratingSaft] = useState(false);
  const [generatingEfactura, setGeneratingEfactura] = useState(false);
  const [saftDialogOpen, setSaftDialogOpen] = useState(false);
  const [saftPeriodFrom, setSaftPeriodFrom] = useState("");
  const [saftPeriodTo, setSaftPeriodTo] = useState("");
  const [selectedInvoiceForEfactura, setSelectedInvoiceForEfactura] = useState<string | null>(null);
  const [efacturaPreviewOpen, setEfacturaPreviewOpen] = useState(false);
  const [efacturaXmlContent, setEfacturaXmlContent] = useState("");
  const [efacturaFilename, setEfacturaFilename] = useState("");
  const [invoicePreviewOpen, setInvoicePreviewOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [invoiceItems, setInvoiceItems] = useState<any[]>([]);
  const [expensePreviewOpen, setExpensePreviewOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

  useEffect(() => {
    checkAccess();
  }, [companyId]);

  const checkAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    // Check if user is an accountant
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (roleData?.role !== "accountant") {
      navigate("/dashboard");
      return;
    }

    // Verify workspace access
    const { data: access } = await supabase
      .from("workspace_members")
      .select("id")
      .eq("member_user_id", user.id)
      .eq("workspace_owner_id", companyId)
      .single();

    if (!access) {
      toast.error("You don't have access to this company");
      navigate("/accountant-dashboard");
      return;
    }

    // Set active workspace
    sessionStorage.setItem("active_workspace_owner", companyId!);
    
    await loadAllData();
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadProfile(),
        loadInvoices(),
        loadExpenses(),
        loadSaftExports(),
        loadAccounts(),
      ]);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Error loading company data");
    } finally {
      setLoading(false);
    }
  };

  const loadProfile = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", companyId)
      .single();

    if (error) {
      console.error("Error loading profile:", error);
    } else {
      setProfile(data);
    }
  };

  const loadInvoices = async () => {
    const { data, error } = await supabase
      .from("invoices")
      .select("id, invoice_number, issue_date, due_date, status, total, currency, clients(name)")
      .eq("user_id", companyId)
      .order("issue_date", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Error loading invoices:", error);
    } else {
      setInvoices(data || []);
    }
  };

  const loadExpenses = async () => {
    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .eq("user_id", companyId)
      .order("expense_date", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Error loading expenses:", error);
    } else {
      setExpenses(data || []);
    }
  };

  const loadSaftExports = async () => {
    const { data, error } = await supabase
      .from("saft_exports")
      .select("*")
      .eq("user_id", companyId)
      .order("generated_at", { ascending: false });

    if (error) {
      console.error("Error loading SAF-T exports:", error);
    } else {
      setSaftExports(data || []);
    }
  };

  const loadAccounts = async () => {
    const { data, error } = await supabase
      .from("accounts")
      .select("*")
      .eq("user_id", companyId)
      .order("account_code", { ascending: true });

    if (error) {
      console.error("Error loading accounts:", error);
    } else {
      setAccounts(data || []);
    }
  };

  const handleDownloadSaft = (saft: SaftExport) => {
    const blob = new Blob([saft.file_data], { type: "text/xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `SAF-T_${format(new Date(saft.period_from), "yyyy-MM")}_${format(new Date(saft.period_to), "yyyy-MM")}.xml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleGenerateSaft = async () => {
    if (!saftPeriodFrom || !saftPeriodTo) {
      toast.error("Please select both start and end dates");
      return;
    }

    setGeneratingSaft(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-saft-xml', {
        body: {
          periodFrom: saftPeriodFrom,
          periodTo: saftPeriodTo,
          workspaceOwnerId: companyId
        }
      });

      if (error) throw error;

      if (data.exportId) {
        toast.success("SAF-T report generated successfully!");
        setSaftDialogOpen(false);
        await loadSaftExports();
      }
    } catch (error: any) {
      console.error("Error generating SAF-T:", error);
      toast.error(error.message || "Failed to generate SAF-T report");
    } finally {
      setGeneratingSaft(false);
    }
  };

  const handleGenerateEfactura = async (invoiceId: string) => {
    setGeneratingEfactura(true);
    setSelectedInvoiceForEfactura(invoiceId);

    try {
      const { data, error } = await supabase.functions.invoke('generate-efactura-xml', {
        body: {
          invoiceId,
          workspaceOwnerId: companyId
        }
      });

      if (error) throw error;

      // Store XML content and filename for preview
      const invoice = invoices.find(inv => inv.id === invoiceId);
      setEfacturaXmlContent(data);
      setEfacturaFilename(`eFactura-${invoice?.invoice_number || invoiceId}.xml`);
      setEfacturaPreviewOpen(true);

      toast.success("e-Factura preview ready!");
    } catch (error: any) {
      console.error("Error generating e-Factura:", error);
      toast.error(error.message || "Failed to generate e-Factura");
    } finally {
      setGeneratingEfactura(false);
      setSelectedInvoiceForEfactura(null);
    }
  };

  const handleDownloadEfactura = () => {
    const blob = new Blob([efacturaXmlContent], { type: "application/xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = efacturaFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success("e-Factura downloaded successfully!");
    setEfacturaPreviewOpen(false);
  };

  const handlePreviewInvoice = async (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    
    // Fetch invoice items
    const { data: items, error } = await supabase
      .from("invoice_items")
      .select("*")
      .eq("invoice_id", invoice.id)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error loading invoice items:", error);
      toast.error("Failed to load invoice details");
      return;
    }

    setInvoiceItems(items || []);
    setInvoicePreviewOpen(true);
  };

  const handlePreviewExpense = (expense: Expense) => {
    setSelectedExpense(expense);
    setExpensePreviewOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "sent":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "draft":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
      case "overdue":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    }
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

  if (!profile) {
    return (
      <DashboardLayout>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Company not found</p>
            <Button onClick={() => navigate("/accountant-dashboard")} className="mt-4">
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  const totalInvoices = invoices.length;
  const totalExpenses = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
  const totalVAT = expenses.reduce((sum, exp) => sum + Number(exp.vat_amount), 0);
  const draftInvoices = invoices.filter(inv => inv.status === "draft").length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Building2 className="h-8 w-8 text-primary" />
              {profile.company_name}
            </h1>
            <p className="text-muted-foreground">Company Details & Financial Data</p>
          </div>
          <Button variant="outline" onClick={() => navigate("/accountant-dashboard")}>
            Back to Companies
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Invoices</p>
                  <p className="text-2xl font-bold">{totalInvoices}</p>
                </div>
                <FileText className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Draft Invoices</p>
                  <p className="text-2xl font-bold">{draftInvoices}</p>
                </div>
                <FileText className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Expenses</p>
                  <p className="text-2xl font-bold">{totalExpenses.toFixed(2)} RON</p>
                </div>
                <Receipt className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">SAF-T Reports</p>
                  <p className="text-2xl font-bold">{saftExports.length}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabbed Content */}
        <Tabs defaultValue="profile" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="profile">
              <User className="h-4 w-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="invoices">
              <FileText className="h-4 w-4 mr-2" />
              Invoices
            </TabsTrigger>
            <TabsTrigger value="expenses">
              <Receipt className="h-4 w-4 mr-2" />
              Expenses
            </TabsTrigger>
            <TabsTrigger value="reports">
              <BarChart3 className="h-4 w-4 mr-2" />
              SAF-T Reports
            </TabsTrigger>
            <TabsTrigger value="accounts">
              <BookOpen className="h-4 w-4 mr-2" />
              Chart of Accounts
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Company Profile</CardTitle>
                <CardDescription>Complete company information and registration details</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Company Name</p>
                      <p className="text-lg font-semibold">{profile.company_name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">CUI/CIF</p>
                      <p className="text-lg">{profile.cui_cif || "Not provided"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Reg. Com.</p>
                      <p className="text-lg">{profile.reg_com || "Not provided"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Bank Account</p>
                      <p className="text-lg font-mono">{profile.bank_account || "Not provided"}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Address</p>
                      <p className="text-lg">{profile.address || "Not provided"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">City</p>
                      <p className="text-lg">{profile.city || "Not provided"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">County</p>
                      <p className="text-lg">{profile.county || "Not provided"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Phone</p>
                      <p className="text-lg">{profile.phone || "Not provided"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Email</p>
                      <p className="text-lg">{profile.email || "Not provided"}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Invoices Tab */}
          <TabsContent value="invoices">
            <Card>
              <CardHeader>
                <CardTitle>Invoices ({totalInvoices})</CardTitle>
                <CardDescription>All invoices for this company</CardDescription>
              </CardHeader>
              <CardContent>
                {invoices.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    No invoices found
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice #</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Issue Date</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoices.map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                          <TableCell>{invoice.clients?.name || "N/A"}</TableCell>
                          <TableCell>{format(new Date(invoice.issue_date), "dd MMM yyyy")}</TableCell>
                          <TableCell>{format(new Date(invoice.due_date), "dd MMM yyyy")}</TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(invoice.status)}>
                              {invoice.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {invoice.total.toFixed(2)} {invoice.currency}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center gap-2 justify-center">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handlePreviewInvoice(invoice)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleGenerateEfactura(invoice.id)}
                                disabled={generatingEfactura && selectedInvoiceForEfactura === invoice.id}
                              >
                                {generatingEfactura && selectedInvoiceForEfactura === invoice.id ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Generating...
                                  </>
                                ) : (
                                  <>
                                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                                    e-Factura
                                  </>
                                )}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Expenses Tab */}
          <TabsContent value="expenses">
            <Card>
              <CardHeader>
                <CardTitle>Expenses ({expenses.length})</CardTitle>
                <CardDescription>
                  All expenses - Total: {totalExpenses.toFixed(2)} RON | VAT: {totalVAT.toFixed(2)} RON
                </CardDescription>
              </CardHeader>
              <CardContent>
                {expenses.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    No expenses found
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Merchant</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="text-right">VAT</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {expenses.map((expense) => (
                        <TableRow key={expense.id}>
                          <TableCell>{format(new Date(expense.expense_date), "dd MMM yyyy")}</TableCell>
                          <TableCell className="font-medium">{expense.merchant}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{expense.category}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {Number(expense.amount).toFixed(2)} {expense.currency}
                          </TableCell>
                          <TableCell className="text-right">
                            {Number(expense.vat_amount).toFixed(2)} {expense.currency}
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(expense.status)}>
                              {expense.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handlePreviewExpense(expense)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* SAF-T Reports Tab */}
          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>SAF-T XML Reports ({saftExports.length})</CardTitle>
                    <CardDescription>Generated SAF-T exports for ANAF compliance</CardDescription>
                  </div>
                  <Dialog open={saftDialogOpen} onOpenChange={setSaftDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <FileDown className="h-4 w-4 mr-2" />
                        Generate New SAF-T
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Generate SAF-T Report</DialogTitle>
                        <DialogDescription>
                          Select the reporting period for the SAF-T XML export
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="periodFrom">Period From</Label>
                          <Input
                            id="periodFrom"
                            type="date"
                            value={saftPeriodFrom}
                            onChange={(e) => setSaftPeriodFrom(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="periodTo">Period To</Label>
                          <Input
                            id="periodTo"
                            type="date"
                            value={saftPeriodTo}
                            onChange={(e) => setSaftPeriodTo(e.target.value)}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setSaftDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleGenerateSaft} disabled={generatingSaft}>
                          {generatingSaft && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Generate SAF-T
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {saftExports.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No SAF-T exports found</p>
                    <p className="text-sm mt-2">Click "Generate New SAF-T" to create your first report</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {saftExports.map((saft) => (
                      <div
                        key={saft.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                      >
                        <div className="flex items-center gap-4">
                          <BarChart3 className="h-8 w-8 text-primary" />
                          <div>
                            <p className="font-medium">
                              Period: {format(new Date(saft.period_from), "MMM yyyy")} - {format(new Date(saft.period_to), "MMM yyyy")}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Generated: {format(new Date(saft.generated_at), "dd MMM yyyy HH:mm")}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={saft.status === "generated" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                            {saft.status}
                          </Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownloadSaft(saft)}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Chart of Accounts Tab */}
          <TabsContent value="accounts">
            <Card>
              <CardHeader>
                <CardTitle>Chart of Accounts ({accounts.length})</CardTitle>
                <CardDescription>Complete list of accounting accounts</CardDescription>
              </CardHeader>
              <CardContent>
                {accounts.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    No accounts found
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Account Code</TableHead>
                        <TableHead>Account Name</TableHead>
                        <TableHead>Type</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {accounts.map((account) => (
                        <TableRow key={account.id}>
                          <TableCell className="font-mono font-medium">{account.account_code}</TableCell>
                          <TableCell>{account.account_name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{account.account_type || "General"}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* e-Factura Preview Dialog */}
        <Dialog open={efacturaPreviewOpen} onOpenChange={setEfacturaPreviewOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>e-Factura XML Preview</DialogTitle>
              <DialogDescription>
                Review the generated e-Factura XML before downloading
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="h-[400px] w-full rounded-md border bg-muted/30 p-4">
              <pre className="text-xs font-mono whitespace-pre-wrap break-all">
                {efacturaXmlContent}
              </pre>
            </ScrollArea>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEfacturaPreviewOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleDownloadEfactura}>
                <Download className="h-4 w-4 mr-2" />
                Download XML
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Invoice Preview Dialog */}
        <Dialog open={invoicePreviewOpen} onOpenChange={setInvoicePreviewOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>Invoice Details</DialogTitle>
              <DialogDescription>
                Complete invoice information
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="h-[500px] w-full">
              {selectedInvoice && (
                <div className="space-y-6 p-4">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Invoice Number</p>
                        <p className="text-lg font-semibold">{selectedInvoice.invoice_number}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Client</p>
                        <p className="text-lg">{selectedInvoice.clients?.name || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Status</p>
                        <Badge className={getStatusColor(selectedInvoice.status)}>
                          {selectedInvoice.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Issue Date</p>
                        <p className="text-lg">{format(new Date(selectedInvoice.issue_date), "dd MMM yyyy")}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Due Date</p>
                        <p className="text-lg">{format(new Date(selectedInvoice.due_date), "dd MMM yyyy")}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Currency</p>
                        <p className="text-lg">{selectedInvoice.currency}</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <p className="text-sm font-medium text-muted-foreground mb-3">Invoice Items</p>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Description</TableHead>
                          <TableHead className="text-right">Qty</TableHead>
                          <TableHead className="text-right">Unit Price</TableHead>
                          <TableHead className="text-right">VAT %</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {invoiceItems.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.description}</TableCell>
                            <TableCell className="text-right">{item.quantity}</TableCell>
                            <TableCell className="text-right">{Number(item.unit_price).toFixed(2)}</TableCell>
                            <TableCell className="text-right">{item.vat_rate}%</TableCell>
                            <TableCell className="text-right font-semibold">
                              {Number(item.total).toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="border-t pt-4">
                    <div className="space-y-2 max-w-xs ml-auto">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal:</span>
                        <span className="font-medium">{selectedInvoice.total.toFixed(2)} {selectedInvoice.currency}</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total:</span>
                        <span>{selectedInvoice.total.toFixed(2)} {selectedInvoice.currency}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </ScrollArea>
            <DialogFooter>
              <Button variant="outline" onClick={() => setInvoicePreviewOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Expense Preview Dialog */}
        <Dialog open={expensePreviewOpen} onOpenChange={setExpensePreviewOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>Expense Details</DialogTitle>
              <DialogDescription>
                Complete expense information
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="h-[500px] w-full">
              {selectedExpense && (
                <div className="space-y-6 p-4">
                  {selectedExpense.image_url && (
                    <div className="border rounded-lg overflow-hidden">
                      <img 
                        src={selectedExpense.image_url} 
                        alt="Expense receipt" 
                        className="w-full h-auto"
                      />
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Merchant</p>
                        <p className="text-lg font-semibold">{selectedExpense.merchant}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Category</p>
                        <Badge variant="outline">{selectedExpense.category}</Badge>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Date</p>
                        <p className="text-lg">{format(new Date(selectedExpense.expense_date), "dd MMM yyyy")}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Status</p>
                        <Badge className={getStatusColor(selectedExpense.status)}>
                          {selectedExpense.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Amount</p>
                        <p className="text-2xl font-bold">
                          {Number(selectedExpense.amount).toFixed(2)} {selectedExpense.currency}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">VAT Amount</p>
                        <p className="text-lg">
                          {Number(selectedExpense.vat_amount).toFixed(2)} {selectedExpense.currency}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Currency</p>
                        <p className="text-lg">{selectedExpense.currency}</p>
                      </div>
                    </div>
                  </div>

                  {selectedExpense.description && (
                    <div className="border-t pt-4">
                      <p className="text-sm font-medium text-muted-foreground mb-2">Description</p>
                      <p className="text-base">{selectedExpense.description}</p>
                    </div>
                  )}

                  {selectedExpense.notes && (
                    <div className="border-t pt-4">
                      <p className="text-sm font-medium text-muted-foreground mb-2">Notes</p>
                      <p className="text-base">{selectedExpense.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>
            <DialogFooter>
              <Button variant="outline" onClick={() => setExpensePreviewOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default CompanyView;
