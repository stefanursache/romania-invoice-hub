import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Building2, FileText, Receipt, BarChart3, BookOpen, Download, Eye, User } from "lucide-react";
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
                <CardTitle>SAF-T XML Reports ({saftExports.length})</CardTitle>
                <CardDescription>Generated SAF-T exports for ANAF compliance</CardDescription>
              </CardHeader>
              <CardContent>
                {saftExports.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    No SAF-T exports found
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
      </div>
    </DashboardLayout>
  );
};

export default CompanyView;
