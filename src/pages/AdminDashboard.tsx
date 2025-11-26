import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, LogOut, Users, Shield, Crown, CreditCard, DollarSign, TrendingUp, AlertCircle } from "lucide-react";
import { WebhookEventsManager } from "@/components/WebhookEventsManager";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [accessRequests, setAccessRequests] = useState<any[]>([]);
  const [userRoles, setUserRoles] = useState<any[]>([]);
  const [paymentConfig, setPaymentConfig] = useState<any>(null);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [stripeApiKey, setStripeApiKey] = useState("");
  const [stripePublishableKey, setStripePublishableKey] = useState("");
  const [stripeWebhookSecret, setStripeWebhookSecret] = useState("");

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
      const [profilesData, requestsData, rolesData, configData, subsData, transData] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("access_requests").select("*").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("*").order("created_at", { ascending: false }),
        supabase.from("payment_gateway_config").select("*").single(),
        supabase.from("user_subscriptions").select("*").order("created_at", { ascending: false }),
        supabase.from("payment_transactions").select("*").order("created_at", { ascending: false }),
      ]);

      setProfiles(profilesData.data || []);
      setAccessRequests(requestsData.data || []);
      setUserRoles(rolesData.data || []);
      setPaymentConfig(configData.data);
      setSubscriptions(subsData.data || []);
      setTransactions(transData.data || []);
      
      if (configData.data) {
        setStripePublishableKey(configData.data.publishable_key || "");
      }
    } catch (error: any) {
      toast.error("Eroare la încărcarea datelor", { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const updatePaymentPlan = async (userId: string, plan: string) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ payment_plan: plan })
        .eq("id", userId);

      if (error) throw error;

      toast.success("Plan de plată actualizat");
      await loadAllData();
    } catch (error: any) {
      toast.error("Eroare la actualizarea planului", { description: error.message });
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from("user_roles")
        .update({ role: newRole })
        .eq("user_id", userId);

      if (error) throw error;

      toast.success("Rol actualizat");
      await loadAllData();
    } catch (error: any) {
      toast.error("Eroare la actualizarea rolului", { description: error.message });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin");
  };

  const saveStripeConfig = async () => {
    try {
      if (!stripeApiKey && !stripePublishableKey && !stripeWebhookSecret) {
        toast.error("Introduceți cel puțin un câmp");
        return;
      }

      const configData: any = {
        gateway_name: "stripe",
        updated_at: new Date().toISOString(),
      };

      if (stripeApiKey) configData.api_key_encrypted = stripeApiKey;
      if (stripePublishableKey) configData.publishable_key = stripePublishableKey;
      if (stripeWebhookSecret) configData.webhook_secret = stripeWebhookSecret;
      if (stripeApiKey || stripePublishableKey || stripeWebhookSecret) {
        configData.is_active = true;
      }

      if (paymentConfig) {
        const { error } = await supabase
          .from("payment_gateway_config")
          .update(configData)
          .eq("id", paymentConfig.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("payment_gateway_config")
          .insert(configData);
        
        if (error) throw error;
      }

      toast.success("Configurare Stripe salvată");
      setStripeApiKey("");
      setStripeWebhookSecret("");
      await loadAllData();
    } catch (error: any) {
      toast.error("Eroare la salvarea configurării", { description: error.message });
    }
  };

  const totalRevenue = transactions
    .filter(t => t.status === "succeeded")
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  const failedPayments = transactions.filter(t => t.status === "failed").length;

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
        <div className="grid gap-4 md:grid-cols-4 mb-8">
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
              <CardTitle className="text-sm font-medium">Roluri Active</CardTitle>
              <Crown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userRoles.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Venituri</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Plăți Eșuate</CardTitle>
              <AlertCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{failedPayments}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="profiles" className="space-y-4">
          <TabsList>
            <TabsTrigger value="profiles">Utilizatori & Planuri</TabsTrigger>
            <TabsTrigger value="roles">Roluri</TabsTrigger>
            <TabsTrigger value="requests">Cereri Acces</TabsTrigger>
            <TabsTrigger value="payments">Plăți</TabsTrigger>
            <TabsTrigger value="webhooks">Webhooks & Retry</TabsTrigger>
          </TabsList>

          <TabsContent value="profiles" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Utilizatori & Planuri de Plată</CardTitle>
                <CardDescription>Gestionează utilizatorii și planurile lor de plată</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Companie</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>CUI/CIF</TableHead>
                      <TableHead>Plan Plată</TableHead>
                      <TableHead>Data Creare</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {profiles.map((profile) => (
                      <TableRow key={profile.id}>
                        <TableCell className="font-medium">{profile.company_name}</TableCell>
                        <TableCell>{profile.email}</TableCell>
                        <TableCell>{profile.cui_cif || "-"}</TableCell>
                        <TableCell>
                          <Select
                            value={profile.payment_plan || "free"}
                            onValueChange={(value) => updatePaymentPlan(profile.id, value)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="free">Free</SelectItem>
                              <SelectItem value="basic">Basic</SelectItem>
                              <SelectItem value="pro">Pro</SelectItem>
                              <SelectItem value="enterprise">Enterprise</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
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
                <CardDescription>Editează rolurile utilizatorilor din sistem</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User ID</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead>Data Creare</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userRoles.map((role) => {
                      const profile = profiles.find(p => p.id === role.user_id);
                      return (
                        <TableRow key={role.id}>
                          <TableCell className="font-mono text-xs">{role.user_id}</TableCell>
                          <TableCell>{profile?.email || "-"}</TableCell>
                          <TableCell>
                            <Select
                              value={role.role}
                              onValueChange={(value) => updateUserRole(role.user_id, value)}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="business">Business</SelectItem>
                                <SelectItem value="accountant">Accountant</SelectItem>
                                <SelectItem value="owner">Owner</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>{new Date(role.created_at).toLocaleDateString("ro-RO")}</TableCell>
                        </TableRow>
                      );
                    })}
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

          <TabsContent value="payments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Configurare Stripe</CardTitle>
                <CardDescription>Introduceți credențialele API pentru Stripe</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="stripeApiKey">Stripe Secret Key</Label>
                    <Input
                      id="stripeApiKey"
                      type="password"
                      placeholder="sk_live_..."
                      value={stripeApiKey}
                      onChange={(e) => setStripeApiKey(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stripePublishableKey">Stripe Publishable Key</Label>
                    <Input
                      id="stripePublishableKey"
                      type="text"
                      placeholder="pk_live_..."
                      value={stripePublishableKey}
                      onChange={(e) => setStripePublishableKey(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stripeWebhookSecret">Stripe Webhook Secret</Label>
                    <Input
                      id="stripeWebhookSecret"
                      type="password"
                      placeholder="whsec_..."
                      value={stripeWebhookSecret}
                      onChange={(e) => setStripeWebhookSecret(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Button onClick={saveStripeConfig}>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Salvează Configurare
                  </Button>
                  {paymentConfig?.is_active && (
                    <Badge variant="default" className="flex items-center gap-1">
                      <CreditCard className="h-3 w-3" />
                      Stripe Activ
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Abonamente Utilizatori</CardTitle>
                <CardDescription>Status abonamente pentru toți utilizatorii</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User ID</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Început Perioadă</TableHead>
                      <TableHead>Sfârșit Perioadă</TableHead>
                      <TableHead>Se Anulează</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subscriptions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          Nu există abonamente înregistrate
                        </TableCell>
                      </TableRow>
                    ) : (
                      subscriptions.map((sub) => (
                        <TableRow key={sub.id}>
                          <TableCell className="font-mono text-xs">{sub.user_id.substring(0, 8)}...</TableCell>
                          <TableCell>{sub.plan_name}</TableCell>
                          <TableCell>
                            <Badge variant={sub.status === "active" ? "default" : "secondary"}>
                              {sub.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {sub.current_period_start
                              ? new Date(sub.current_period_start).toLocaleDateString("ro-RO")
                              : "-"}
                          </TableCell>
                          <TableCell>
                            {sub.current_period_end
                              ? new Date(sub.current_period_end).toLocaleDateString("ro-RO")
                              : "-"}
                          </TableCell>
                          <TableCell>{sub.cancel_at_period_end ? "Da" : "Nu"}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Istoric Tranzacții</CardTitle>
                  <CardDescription>Ultimele tranzacții de plată</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User ID</TableHead>
                        <TableHead>Sumă</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Data</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground">
                            Nu există tranzacții înregistrate
                          </TableCell>
                        </TableRow>
                      ) : (
                        transactions.slice(0, 10).map((trans) => (
                          <TableRow key={trans.id}>
                            <TableCell className="font-mono text-xs">{trans.user_id.substring(0, 8)}...</TableCell>
                            <TableCell>${parseFloat(trans.amount).toFixed(2)}</TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  trans.status === "succeeded"
                                    ? "default"
                                    : trans.status === "failed"
                                    ? "destructive"
                                    : "secondary"
                                }
                              >
                                {trans.status}
                              </Badge>
                            </TableCell>
                            <TableCell>{new Date(trans.created_at).toLocaleDateString("ro-RO")}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Plăți Eșuate</CardTitle>
                  <CardDescription>Tranzacții cu probleme</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User ID</TableHead>
                        <TableHead>Sumă</TableHead>
                        <TableHead>Data</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.filter(t => t.status === "failed").length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-muted-foreground">
                            Nu există plăți eșuate
                          </TableCell>
                        </TableRow>
                      ) : (
                        transactions
                          .filter(t => t.status === "failed")
                          .slice(0, 10)
                          .map((trans) => (
                            <TableRow key={trans.id}>
                              <TableCell className="font-mono text-xs">{trans.user_id.substring(0, 8)}...</TableCell>
                              <TableCell>${parseFloat(trans.amount).toFixed(2)}</TableCell>
                              <TableCell>{new Date(trans.created_at).toLocaleDateString("ro-RO")}</TableCell>
                            </TableRow>
                          ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="webhooks" className="space-y-4">
            <WebhookEventsManager />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
