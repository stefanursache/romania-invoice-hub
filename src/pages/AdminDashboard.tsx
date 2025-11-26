import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, LogOut, Users, FileText, Receipt, Building2, Key, Shield } from "lucide-react";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [accessRequests, setAccessRequests] = useState<any[]>([]);
  const [userRoles, setUserRoles] = useState<any[]>([]);

  useEffect(() => {
    checkAdminAndLoadData();
  }, []);

  const checkAdminAndLoadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/admin");
        return;
      }

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .single();

      if (!roleData) {
        toast.error("Acces interzis");
        navigate("/admin");
        return;
      }

      await loadAllData();
    } catch (error) {
      console.error("Error checking admin:", error);
      navigate("/admin");
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [profilesData, invoicesData, expensesData, clientsData, requestsData, rolesData] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("invoices").select("*, clients(name)").order("created_at", { ascending: false }).limit(50),
        supabase.from("expenses").select("*").order("created_at", { ascending: false }).limit(50),
        supabase.from("clients").select("*").order("created_at", { ascending: false }).limit(50),
        supabase.from("access_requests").select("*").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("*").order("created_at", { ascending: false }),
      ]);

      setProfiles(profilesData.data || []);
      setInvoices(invoicesData.data || []);
      setExpenses(expensesData.data || []);
      setClients(clientsData.data || []);
      setAccessRequests(requestsData.data || []);
      setUserRoles(rolesData.data || []);
    } catch (error: any) {
      toast.error("Eroare la încărcarea datelor", { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Panou Administrare</h1>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Ieșire
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Utilizatori</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{profiles.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Facturi</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{invoices.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cheltuieli</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{expenses.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clienți</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{clients.length}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="profiles" className="space-y-4">
          <TabsList>
            <TabsTrigger value="profiles">Profiluri</TabsTrigger>
            <TabsTrigger value="roles">Roluri</TabsTrigger>
            <TabsTrigger value="invoices">Facturi</TabsTrigger>
            <TabsTrigger value="expenses">Cheltuieli</TabsTrigger>
            <TabsTrigger value="clients">Clienți</TabsTrigger>
            <TabsTrigger value="requests">Cereri Acces</TabsTrigger>
          </TabsList>

          <TabsContent value="profiles" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Profiluri Utilizatori</CardTitle>
                <CardDescription>Lista tuturor profilurilor din sistem</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Companie</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>CUI/CIF</TableHead>
                      <TableHead>Oraș</TableHead>
                      <TableHead>Data Creare</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {profiles.map((profile) => (
                      <TableRow key={profile.id}>
                        <TableCell className="font-medium">{profile.company_name}</TableCell>
                        <TableCell>{profile.email}</TableCell>
                        <TableCell>{profile.cui_cif || "-"}</TableCell>
                        <TableCell>{profile.city || "-"}</TableCell>
                        <TableCell>{new Date(profile.created_at).toLocaleDateString("ro-RO")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="roles" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Roluri Utilizatori</CardTitle>
                <CardDescription>Administrarea rolurilor din sistem</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User ID</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead>Data Creare</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userRoles.map((role) => (
                      <TableRow key={role.id}>
                        <TableCell className="font-mono text-xs">{role.user_id}</TableCell>
                        <TableCell>
                          <Badge variant={role.role === "admin" ? "destructive" : "secondary"}>
                            {role.role}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(role.created_at).toLocaleDateString("ro-RO")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="invoices" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Facturi</CardTitle>
                <CardDescription>Ultimele 50 de facturi din sistem</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Număr</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data Emitere</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                        <TableCell>{invoice.clients?.name || "-"}</TableCell>
                        <TableCell>{invoice.total} {invoice.currency}</TableCell>
                        <TableCell>
                          <Badge variant={invoice.status === "paid" ? "default" : "secondary"}>
                            {invoice.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(invoice.issue_date).toLocaleDateString("ro-RO")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="expenses" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Cheltuieli</CardTitle>
                <CardDescription>Ultimele 50 de cheltuieli din sistem</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Comerciant</TableHead>
                      <TableHead>Categorie</TableHead>
                      <TableHead>Sumă</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenses.map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell className="font-medium">{expense.merchant}</TableCell>
                        <TableCell>{expense.category}</TableCell>
                        <TableCell>{expense.amount} {expense.currency}</TableCell>
                        <TableCell>
                          <Badge variant={expense.status === "approved" ? "default" : "secondary"}>
                            {expense.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(expense.expense_date).toLocaleDateString("ro-RO")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="clients" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Clienți</CardTitle>
                <CardDescription>Ultimii 50 de clienți din sistem</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nume</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Telefon</TableHead>
                      <TableHead>CUI/CIF</TableHead>
                      <TableHead>Data Creare</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clients.map((client) => (
                      <TableRow key={client.id}>
                        <TableCell className="font-medium">{client.name}</TableCell>
                        <TableCell>{client.email || "-"}</TableCell>
                        <TableCell>{client.phone || "-"}</TableCell>
                        <TableCell>{client.cui_cif || "-"}</TableCell>
                        <TableCell>{new Date(client.created_at).toLocaleDateString("ro-RO")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="requests" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Cereri de Acces</CardTitle>
                <CardDescription>Solicitări de acces contabil</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email Business</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data Solicitare</TableHead>
                      <TableHead>Data Răspuns</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accessRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>{request.business_owner_email}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              request.status === "accepted"
                                ? "default"
                                : request.status === "rejected"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {request.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(request.requested_at).toLocaleDateString("ro-RO")}</TableCell>
                        <TableCell>
                          {request.responded_at
                            ? new Date(request.responded_at).toLocaleDateString("ro-RO")
                            : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
