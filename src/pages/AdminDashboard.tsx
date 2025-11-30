import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, LogOut, Shield, Users as UsersIcon, CreditCard, Webhook, TrendingUp, Sparkles } from "lucide-react";
import { WebhookEventsManager } from "@/components/WebhookEventsManager";
import { UsersTable } from "@/components/admin/UsersTable";
import { PlanStatsCards } from "@/components/admin/PlanStatsCards";
import { RevenueAnalytics } from "@/components/admin/RevenueAnalytics";
import { StartupDiscountList } from "@/components/admin/StartupDiscountList";
import { StripePlanManager } from "@/components/admin/StripePlanManager";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    freeUsers: 0,
    starterUsers: 0,
    professionalUsers: 0,
    enterpriseUsers: 0,
    totalInvoicesThisMonth: 0,
  });
  const [paymentConfig, setPaymentConfig] = useState<any>(null);
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
      // Get current month start date
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      // Load all profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // For each user, get their invoice count this month and member count
      const usersWithStats = await Promise.all(
        (profilesData || []).map(async (profile) => {
          const [invoiceResult, memberResult, totalInvoiceResult] = await Promise.all([
            supabase
              .from("invoices")
              .select("*", { count: "exact", head: true })
              .eq("user_id", profile.id)
              .gte("created_at", startOfMonth.toISOString()),
            supabase
              .from("workspace_members")
              .select("*", { count: "exact", head: true })
              .eq("workspace_owner_id", profile.id),
            supabase
              .from("invoices")
              .select("*", { count: "exact", head: true })
              .eq("user_id", profile.id),
          ]);

          return {
            ...profile,
            invoices_this_month: invoiceResult.count || 0,
            member_count: memberResult.count || 0,
            invoice_count: totalInvoiceResult.count || 0,
          };
        })
      );

      setUsers(usersWithStats);

      // Calculate stats
      const planCounts = usersWithStats.reduce(
        (acc, user) => {
          const plan = user.payment_plan?.toLowerCase() || "free";
          if (plan === "starter") acc.starterUsers++;
          else if (plan === "professional") acc.professionalUsers++;
          else if (plan === "enterprise") acc.enterpriseUsers++;
          else acc.freeUsers++;
          return acc;
        },
        { freeUsers: 0, starterUsers: 0, professionalUsers: 0, enterpriseUsers: 0 }
      );

      const totalInvoicesThisMonth = usersWithStats.reduce(
        (sum, user) => sum + (user.invoices_this_month || 0),
        0
      );

      setStats({
        totalUsers: usersWithStats.length,
        ...planCounts,
        totalInvoicesThisMonth,
      });

      // Load payment config
      const { data: configData } = await supabase
        .from("payment_gateway_config")
        .select("*")
        .single();

      setPaymentConfig(configData);
      if (configData) {
        setStripePublishableKey(configData.publishable_key || "");
      }
    } catch (error: any) {
      console.error("Error loading data:", error);
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
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Ieșire
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        <PlanStatsCards stats={stats} />

        <Tabs defaultValue="users" className="space-y-4">
          <TabsList className="w-full overflow-x-auto flex-wrap h-auto gap-2 p-2">
            <TabsTrigger value="users" className="flex items-center gap-2 min-h-[44px] flex-1 sm:flex-initial">
              <UsersIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Utilizatori</span>
            </TabsTrigger>
            <TabsTrigger value="startup-discounts" className="flex items-center gap-2 min-h-[44px] flex-1 sm:flex-initial">
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">Reduceri</span>
            </TabsTrigger>
            <TabsTrigger value="revenue" className="flex items-center gap-2 min-h-[44px] flex-1 sm:flex-initial">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Venituri</span>
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center gap-2 min-h-[44px] flex-1 sm:flex-initial">
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline">Stripe</span>
            </TabsTrigger>
            <TabsTrigger value="webhooks" className="flex items-center gap-2 min-h-[44px] flex-1 sm:flex-initial">
              <Webhook className="h-4 w-4" />
              <span className="hidden sm:inline">Webhooks</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Gestionare Utilizatori</CardTitle>
                <CardDescription>
                  Vizualizează și gestionează utilizatorii, planurile lor și utilizarea resurselor
                </CardDescription>
              </CardHeader>
              <CardContent>
                <UsersTable users={users} onRefresh={loadAllData} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="startup-discounts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Gestionare Reduceri Start-up
                </CardTitle>
                <CardDescription>
                  Vizualizează și gestionează eligibilitatea utilizatorilor pentru reducerea Start-up de 50%
                </CardDescription>
              </CardHeader>
              <CardContent>
                <StartupDiscountList />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="revenue" className="space-y-4">
            <RevenueAnalytics />
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
            
            <StripePlanManager />
          </TabsContent>

          <TabsContent value="webhooks" className="space-y-4">
            <WebhookEventsManager />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
