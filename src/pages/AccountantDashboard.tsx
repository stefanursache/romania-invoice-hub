import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, FileText, TrendingUp, Users, ArrowRight, Loader2, Calendar } from "lucide-react";
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
  const [loading, setLoading] = useState(true);
  const [workspaces, setWorkspaces] = useState<WorkspaceAccess[]>([]);

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
    // Store the workspace owner ID in session storage
    sessionStorage.setItem("active_workspace_owner", workspaceOwnerId);
    navigate("/dashboard");
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
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Dashboard Contabil</h1>
          <p className="text-muted-foreground">Gestionează toate companiile pentru care lucrezi</p>
        </div>

        {workspaces.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Nu ai acces la nicio companie încă</h3>
              <p className="text-muted-foreground mb-4">
                Contactează companiile pentru care lucrezi și cere-le să te invite ca și contabil.
              </p>
              <p className="text-sm text-muted-foreground">
                Ei vor putea să te invite din secțiunea <strong>Echipă</strong> din contul lor.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Companiile tale ({workspaces.length})</h2>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {workspaces.map((workspace) => (
                <Card key={workspace.workspace_owner_id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Building2 className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{workspace.owner_profile.company_name}</CardTitle>
                          <CardDescription className="text-xs mt-1">
                            {workspace.owner_profile.email}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge variant="secondary">{workspace.role}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="flex items-center justify-center gap-1 text-2xl font-bold text-primary">
                          <FileText className="h-4 w-4" />
                          {workspace.stats.totalInvoices}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Facturi</p>
                      </div>
                      <div>
                        <div className="flex items-center justify-center gap-1 text-2xl font-bold text-accent">
                          <Users className="h-4 w-4" />
                          {workspace.stats.totalClients}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Clienți</p>
                      </div>
                      <div>
                        <div className="flex items-center justify-center gap-1 text-2xl font-bold text-muted-foreground">
                          <TrendingUp className="h-4 w-4" />
                          {workspace.stats.draftInvoices}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Ciorne</p>
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                        <Calendar className="h-3 w-3" />
                        Acces din: {format(new Date(workspace.invited_at), "dd MMM yyyy", { locale: ro })}
                      </div>
                      <Button 
                        onClick={() => handleAccessWorkspace(workspace.workspace_owner_id)}
                        className="w-full"
                      >
                        Acces la date
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AccountantDashboard;
