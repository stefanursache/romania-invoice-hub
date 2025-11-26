import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AccountantNotifications } from "@/components/AccountantNotifications";
import AccountantAccessRequest from "@/components/AccountantAccessRequest";
import { useTranslation } from "react-i18next";
import { 
  Building2, 
  FileText, 
  TrendingUp, 
  Users, 
  ArrowRight, 
  Loader2, 
  Calendar,
  Search,
  Sparkles,
  BarChart3,
  Clock,
  CheckCircle2
} from "lucide-react";
import { format } from "date-fns";
import { ro } from "date-fns/locale";

interface WorkspaceAccess {
  workspace_owner_id: string;
  role: string;
  invited_at: string;
  owner_profile: {
    company_name: string;
    email: string;
  };
  stats: {
    totalInvoices: number;
    draftInvoices: number;
    totalClients: number;
  };
}

const AccountantDashboard = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [workspaces, setWorkspaces] = useState<WorkspaceAccess[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
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

    await loadWorkspaces(user.id);
  };

  const loadWorkspaces = async (userId: string) => {
    setLoading(true);
    try {
      // Get all workspace memberships
      const { data: memberships, error: membershipsError } = await supabase
        .from("workspace_members")
        .select("workspace_owner_id, role, invited_at")
        .eq("member_user_id", userId);

      if (membershipsError) throw membershipsError;

      // Load details for each workspace
      const workspaceDetails = await Promise.all(
        (memberships || []).map(async (membership) => {
          // Get owner profile
          const { data: profile } = await supabase
            .from("profiles")
            .select("company_name, email")
            .eq("id", membership.workspace_owner_id)
            .single();

          // Get stats
          const [invoicesRes, clientsRes] = await Promise.all([
            supabase
              .from("invoices")
              .select("status", { count: "exact" })
              .eq("user_id", membership.workspace_owner_id),
            supabase
              .from("clients")
              .select("id", { count: "exact" })
              .eq("user_id", membership.workspace_owner_id),
          ]);

          const draftCount = invoicesRes.data?.filter(inv => inv.status === "draft").length || 0;

          return {
            workspace_owner_id: membership.workspace_owner_id,
            role: membership.role,
            invited_at: membership.invited_at,
            owner_profile: profile || { company_name: "N/A", email: "N/A" },
            stats: {
              totalInvoices: invoicesRes.count || 0,
              draftInvoices: draftCount,
              totalClients: clientsRes.count || 0,
            },
          };
        })
      );

      setWorkspaces(workspaceDetails);
    } catch (error) {
      console.error("Error loading workspaces:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccessWorkspace = (workspaceOwnerId: string) => {
    // Navigate to dedicated company view
    navigate(`/company/${workspaceOwnerId}`);
  };

  const filteredWorkspaces = workspaces.filter(workspace =>
    workspace.owner_profile.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    workspace.owner_profile.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalStats = workspaces.reduce(
    (acc, ws) => ({
      totalInvoices: acc.totalInvoices + ws.stats.totalInvoices,
      totalClients: acc.totalClients + ws.stats.totalClients,
      draftInvoices: acc.draftInvoices + ws.stats.draftInvoices,
    }),
    { totalInvoices: 0, totalClients: 0, draftInvoices: 0 }
  );

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
      <div className="space-y-8">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-accent p-8 md:p-12 text-primary-foreground">
          <div className="absolute inset-0 bg-grid-white/10" />
          <div className="relative z-10 space-y-4">
            <Badge variant="secondary" className="gap-2 mb-2">
              <Sparkles className="h-3 w-3" />
              Dashboard Contabil
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold">
              Bine ai venit înapoi! 👋
            </h1>
            <p className="text-lg opacity-90 max-w-2xl">
              Gestionează toate companiile pentru care lucrezi dintr-un singur loc. 
              Acces rapid la facturi, rapoarte și date financiare.
            </p>
          </div>
        </div>

        <AccountantAccessRequest />

        {workspaces.length === 0 ? (
          <Card className="border-2 border-dashed">
            <CardContent className="py-16 text-center space-y-6">
              <div className="relative mx-auto w-24 h-24">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full animate-pulse" />
                <div className="relative flex items-center justify-center w-full h-full bg-background rounded-full border-2 border-dashed">
                  <Building2 className="h-10 w-10 text-muted-foreground" />
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-2xl font-bold">Nu ai acces la nicio companie încă</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Contactează companiile pentru care lucrezi și cere-le să te invite ca și contabil.
                </p>
              </div>

              <Card className="max-w-lg mx-auto bg-muted/50 border-0">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-start gap-3 text-left">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-primary font-bold text-sm">1</span>
                    </div>
                    <div>
                      <p className="font-medium">Companiile te invită</p>
                      <p className="text-sm text-muted-foreground">
                        Ei vor putea să te invite din secțiunea <strong>Echipă</strong> din contul lor
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 text-left">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-primary font-bold text-sm">2</span>
                    </div>
                    <div>
                      <p className="font-medium">Primești acces instant</p>
                      <p className="text-sm text-muted-foreground">
                        După invitație, vei vedea automat toate datele companiei aici
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 text-left">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-primary font-bold text-sm">3</span>
                    </div>
                    <div>
                      <p className="font-medium">Gestionează totul centralizat</p>
                      <p className="text-sm text-muted-foreground">
                        Accesează facturi, clienți, rapoarte și SAF-T exports pentru fiecare companie
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/50 dark:to-blue-900/30 border-blue-200 dark:border-blue-800">
                <CardContent className="p-6 space-y-2">
                  <div className="flex items-center justify-between">
                    <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <Badge variant="secondary" className="text-xs">Total</Badge>
                  </div>
                  <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                    {workspaces.length}
                  </div>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Companii gestionate
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/50 dark:to-purple-900/30 border-purple-200 dark:border-purple-800">
                <CardContent className="p-6 space-y-2">
                  <div className="flex items-center justify-between">
                    <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    <Badge variant="secondary" className="text-xs">Suma</Badge>
                  </div>
                  <div className="text-3xl font-bold text-purple-900 dark:text-purple-100">
                    {totalStats.totalInvoices}
                  </div>
                  <p className="text-sm text-purple-700 dark:text-purple-300">
                    Facturi totale
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/50 dark:to-green-900/30 border-green-200 dark:border-green-800">
                <CardContent className="p-6 space-y-2">
                  <div className="flex items-center justify-between">
                    <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <Badge variant="secondary" className="text-xs">Total</Badge>
                  </div>
                  <div className="text-3xl font-bold text-green-900 dark:text-green-100">
                    {totalStats.totalClients}
                  </div>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Clienți totali
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-950/50 dark:to-orange-900/30 border-orange-200 dark:border-orange-800">
                <CardContent className="p-6 space-y-2">
                  <div className="flex items-center justify-between">
                    <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    <Badge variant="secondary" className="text-xs">Ciorne</Badge>
                  </div>
                  <div className="text-3xl font-bold text-orange-900 dark:text-orange-100">
                    {totalStats.draftInvoices}
                  </div>
                  <p className="text-sm text-orange-700 dark:text-orange-300">
                    Necesită atenție
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Notifications/Alerts Section */}
            <AccountantNotifications />

            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold">Companiile tale</h2>
                <p className="text-sm text-muted-foreground">
                  {filteredWorkspaces.length} {filteredWorkspaces.length === 1 ? 'companie' : 'companii'}
                </p>
              </div>
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Caută după nume sau email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Company Cards */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredWorkspaces.map((workspace, idx) => (
                <Card 
                  key={workspace.workspace_owner_id} 
                  className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-2 hover:border-primary/20 overflow-hidden animate-fade-in"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  {/* Gradient header */}
                  <div className="h-2 bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_100%] group-hover:animate-gradient" />
                  
                  <CardHeader className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                          <Building2 className="h-7 w-7 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <CardTitle className="text-lg truncate">
                            {workspace.owner_profile.company_name}
                          </CardTitle>
                          <CardDescription className="text-xs truncate mt-1">
                            {workspace.owner_profile.email}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge variant="secondary" className="flex-shrink-0">
                        {workspace.role}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center space-y-2">
                        <div className="w-10 h-10 mx-auto rounded-lg bg-primary/10 flex items-center justify-center">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="text-2xl font-bold">{workspace.stats.totalInvoices}</div>
                          <p className="text-xs text-muted-foreground">Facturi</p>
                        </div>
                      </div>
                      <div className="text-center space-y-2">
                        <div className="w-10 h-10 mx-auto rounded-lg bg-accent/10 flex items-center justify-center">
                          <Users className="h-5 w-5 text-accent" />
                        </div>
                        <div>
                          <div className="text-2xl font-bold">{workspace.stats.totalClients}</div>
                          <p className="text-xs text-muted-foreground">Clienți</p>
                        </div>
                      </div>
                      <div className="text-center space-y-2">
                        <div className="w-10 h-10 mx-auto rounded-lg bg-orange-500/10 flex items-center justify-center">
                          <Clock className="h-5 w-5 text-orange-500" />
                        </div>
                        <div>
                          <div className="text-2xl font-bold">{workspace.stats.draftInvoices}</div>
                          <p className="text-xs text-muted-foreground">Ciorne</p>
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="pt-4 border-t space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>Din {format(new Date(workspace.invited_at), "dd MMM yyyy", { locale: ro })}</span>
                        </div>
                        <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                          <CheckCircle2 className="h-3 w-3" />
                          <span className="font-medium">Activ</span>
                        </div>
                      </div>
                      <Button 
                        onClick={() => handleAccessWorkspace(workspace.workspace_owner_id)}
                        className="w-full group/btn"
                      >
                        Acces la date
                        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredWorkspaces.length === 0 && searchQuery && (
              <Card className="border-2 border-dashed">
                <CardContent className="py-12 text-center">
                  <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">Nicio companie găsită</h3>
                  <p className="text-muted-foreground">
                    Încearcă un alt termen de căutare
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AccountantDashboard;
