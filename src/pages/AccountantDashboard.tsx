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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  CheckCircle2,
  AlertCircle,
  Download,
  Filter,
  SortAsc,
  Eye
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
  const [sortBy, setSortBy] = useState<"name" | "invoices" | "drafts" | "recent">("name");
  const [filterBy, setFilterBy] = useState<"all" | "active" | "attention">("all");

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

  // Filter workspaces
  let filteredWorkspaces = workspaces.filter(workspace =>
    workspace.owner_profile.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    workspace.owner_profile.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Apply filter
  if (filterBy === "attention") {
    filteredWorkspaces = filteredWorkspaces.filter(ws => ws.stats.draftInvoices > 0);
  }

  // Sort workspaces
  filteredWorkspaces.sort((a, b) => {
    switch (sortBy) {
      case "name":
        return a.owner_profile.company_name.localeCompare(b.owner_profile.company_name);
      case "invoices":
        return b.stats.totalInvoices - a.stats.totalInvoices;
      case "drafts":
        return b.stats.draftInvoices - a.stats.draftInvoices;
      case "recent":
        return new Date(b.invited_at).getTime() - new Date(a.invited_at).getTime();
      default:
        return 0;
    }
  });

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
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-accent p-6 md:p-10 text-primary-foreground">
          <div className="absolute inset-0 bg-grid-white/10" />
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="space-y-3">
                <Badge variant="secondary" className="gap-2">
                  <Sparkles className="h-3 w-3" />
                  Dashboard Contabil
                </Badge>
                <h1 className="text-3xl md:text-4xl font-bold">
                  Bine ai venit înapoi! 👋
                </h1>
                <p className="text-sm md:text-base opacity-90 max-w-2xl">
                  Panou centralizat pentru toate companiile tale
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button variant="secondary" size="sm" className="gap-2">
                  <Download className="h-4 w-4" />
                  Export global
                </Button>
                <Button variant="secondary" size="sm" className="gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Rapoarte
                </Button>
              </div>
            </div>
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <Badge variant="outline" className="text-xs">Total</Badge>
                  </div>
                  <div className="text-2xl font-bold mb-1">{workspaces.length}</div>
                  <p className="text-xs text-muted-foreground">Companii active</p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <Badge variant="outline" className="text-xs">Facturi</Badge>
                  </div>
                  <div className="text-2xl font-bold mb-1">{totalStats.totalInvoices}</div>
                  <p className="text-xs text-muted-foreground">Documente totale</p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <Badge variant="outline" className="text-xs">Clienți</Badge>
                  </div>
                  <div className="text-2xl font-bold mb-1">{totalStats.totalClients}</div>
                  <p className="text-xs text-muted-foreground">Parteneri business</p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-950/20">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                      <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <Badge variant="outline" className="text-xs border-orange-300">Urgent</Badge>
                  </div>
                  <div className="text-2xl font-bold mb-1 text-orange-700 dark:text-orange-300">
                    {totalStats.draftInvoices}
                  </div>
                  <p className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                    Necesită atenție
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Notifications/Alerts Section */}
            <AccountantNotifications />

            {/* Search, Filter and Sort */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Caută companie după nume sau email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <Select value={filterBy} onValueChange={(v) => setFilterBy(v as any)}>
                      <SelectTrigger className="w-[160px]">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toate ({workspaces.length})</SelectItem>
                        <SelectItem value="attention">
                          Necesită atenție ({workspaces.filter(w => w.stats.draftInvoices > 0).length})
                        </SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                      <SelectTrigger className="w-[160px]">
                        <SortAsc className="h-4 w-4 mr-2" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="name">Nume (A-Z)</SelectItem>
                        <SelectItem value="invoices">Facturi (↓)</SelectItem>
                        <SelectItem value="drafts">Ciorne (↓)</SelectItem>
                        <SelectItem value="recent">Adăugate recent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    {filteredWorkspaces.length} {filteredWorkspaces.length === 1 ? 'companie găsită' : 'companii găsite'}
                  </p>
                  {searchQuery && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSearchQuery("")}
                      className="h-7 text-xs"
                    >
                      Resetează căutarea
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Company Cards */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredWorkspaces.map((workspace, idx) => (
                <Card 
                  key={workspace.workspace_owner_id} 
                  className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden"
                >
                  {/* Status indicator */}
                  {workspace.stats.draftInvoices > 0 ? (
                    <div className="h-1.5 bg-gradient-to-r from-orange-400 to-orange-600" />
                  ) : (
                    <div className="h-1.5 bg-gradient-to-r from-green-400 to-green-600" />
                  )}
                  
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center flex-shrink-0">
                          <Building2 className="h-6 w-6 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <CardTitle className="text-base truncate mb-1">
                            {workspace.owner_profile.company_name}
                          </CardTitle>
                          <CardDescription className="text-xs truncate">
                            {workspace.owner_profile.email}
                          </CardDescription>
                        </div>
                      </div>
                      {workspace.stats.draftInvoices > 0 && (
                        <Badge variant="outline" className="flex-shrink-0 border-orange-300 text-orange-700 dark:text-orange-400">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Atenție
                        </Badge>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Quick Stats */}
                    <div className="grid grid-cols-3 gap-3 p-3 bg-muted/30 rounded-lg">
                      <div className="text-center">
                        <div className="text-xl font-bold text-primary">{workspace.stats.totalInvoices}</div>
                        <p className="text-xs text-muted-foreground mt-0.5">Facturi</p>
                      </div>
                      <div className="text-center border-x border-border">
                        <div className="text-xl font-bold text-accent">{workspace.stats.totalClients}</div>
                        <p className="text-xs text-muted-foreground mt-0.5">Clienți</p>
                      </div>
                      <div className="text-center">
                        <div className={`text-xl font-bold ${workspace.stats.draftInvoices > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-muted-foreground'}`}>
                          {workspace.stats.draftInvoices}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">Ciorne</p>
                      </div>
                    </div>

                    {/* Action Footer */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-muted-foreground pb-2">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3 w-3" />
                          <span>Adăugat {format(new Date(workspace.invited_at), "dd MMM yyyy", { locale: ro })}</span>
                        </div>
                        <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                          <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                          <span className="text-xs font-medium">Activ</span>
                        </div>
                      </div>
                      <Button 
                        onClick={() => handleAccessWorkspace(workspace.workspace_owner_id)}
                        className="w-full group-hover:shadow-md transition-all gap-2"
                        size="sm"
                      >
                        <Eye className="h-4 w-4" />
                        Accesează dashboard
                        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
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
