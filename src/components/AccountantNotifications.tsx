import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, FileText, Building2, Clock, AlertTriangle, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface ClientAlert {
  workspaceId: string;
  companyName: string;
  type: 'draft_invoices' | 'overdue_invoices' | 'missing_info' | 'no_recent_activity';
  severity: 'low' | 'medium' | 'high';
  count?: number;
  message: string;
}

export const AccountantNotifications = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<ClientAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get all workspace memberships
      const { data: memberships } = await supabase
        .from("workspace_members")
        .select("workspace_owner_id")
        .eq("member_user_id", user.id);

      if (!memberships) {
        setLoading(false);
        return;
      }

      const clientAlerts: ClientAlert[] = [];

      // Check each workspace
      for (const membership of memberships) {
        const ownerId = membership.workspace_owner_id;

        // Get company profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("company_name, cui_cif, reg_com, address")
          .eq("id", ownerId)
          .single();

        const companyName = profile?.company_name || "Unknown Company";

        // Check for missing company information
        if (!profile?.cui_cif || !profile?.reg_com || !profile?.address) {
          clientAlerts.push({
            workspaceId: ownerId,
            companyName,
            type: 'missing_info',
            severity: 'medium',
            message: t('notifications.missingCompanyInfo')
          });
        }

        // Check for draft invoices
        const { data: draftInvoices, count: draftCount } = await supabase
          .from("invoices")
          .select("id", { count: "exact" })
          .eq("user_id", ownerId)
          .eq("status", "draft");

        if (draftCount && draftCount > 0) {
          clientAlerts.push({
            workspaceId: ownerId,
            companyName,
            type: 'draft_invoices',
            severity: 'low',
            count: draftCount,
            message: t('notifications.draftInvoices', { count: draftCount })
          });
        }

        // Check for overdue invoices
        const today = new Date().toISOString().split('T')[0];
        const { data: overdueInvoices, count: overdueCount } = await supabase
          .from("invoices")
          .select("id", { count: "exact" })
          .eq("user_id", ownerId)
          .eq("status", "sent")
          .lt("due_date", today);

        if (overdueCount && overdueCount > 0) {
          clientAlerts.push({
            workspaceId: ownerId,
            companyName,
            type: 'overdue_invoices',
            severity: 'high',
            count: overdueCount,
            message: t('notifications.overdueInvoices', { count: overdueCount })
          });
        }

        // Check for no recent activity (no invoices in last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const { data: recentInvoices } = await supabase
          .from("invoices")
          .select("id")
          .eq("user_id", ownerId)
          .gte("created_at", thirtyDaysAgo.toISOString())
          .limit(1);

        if (!recentInvoices || recentInvoices.length === 0) {
          clientAlerts.push({
            workspaceId: ownerId,
            companyName,
            type: 'no_recent_activity',
            severity: 'low',
            message: t('notifications.noRecentActivity')
          });
        }
      }

      setAlerts(clientAlerts);
    } catch (error) {
      console.error("Error loading alerts:", error);
      toast.error(t('notifications.errorLoading'));
    } finally {
      setLoading(false);
    }
  };

  const handleViewCompany = (workspaceId: string) => {
    sessionStorage.setItem("active_workspace_owner", workspaceId);
    navigate("/dashboard");
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 text-red-900 border-red-200 dark:bg-red-950 dark:text-red-100 dark:border-red-800';
      case 'medium':
        return 'bg-orange-100 text-orange-900 border-orange-200 dark:bg-orange-950 dark:text-orange-100 dark:border-orange-800';
      case 'low':
        return 'bg-blue-100 text-blue-900 border-blue-200 dark:bg-blue-950 dark:text-blue-100 dark:border-blue-800';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'draft_invoices':
        return <Clock className="h-5 w-5" />;
      case 'overdue_invoices':
        return <AlertCircle className="h-5 w-5" />;
      case 'missing_info':
        return <AlertTriangle className="h-5 w-5" />;
      case 'no_recent_activity':
        return <FileText className="h-5 w-5" />;
      default:
        return <AlertCircle className="h-5 w-5" />;
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'high':
        return t('notifications.high');
      case 'medium':
        return t('notifications.medium');
      case 'low':
        return t('notifications.info');
      default:
        return severity;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (alerts.length === 0) {
    return (
      <Card className="border-2 border-dashed">
        <CardContent className="py-12 text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-950 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-lg font-semibold mb-2">{t('notifications.allGood')}</h3>
          <p className="text-muted-foreground">{t('notifications.noAlerts')}</p>
        </CardContent>
      </Card>
    );
  }

  // Group alerts by severity
  const highPriority = alerts.filter(a => a.severity === 'high');
  const mediumPriority = alerts.filter(a => a.severity === 'medium');
  const lowPriority = alerts.filter(a => a.severity === 'low');

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-700 dark:text-red-300">{t('notifications.urgent')}</p>
                <p className="text-3xl font-bold text-red-900 dark:text-red-100">{highPriority.length}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-700 dark:text-orange-300">{t('notifications.warning')}</p>
                <p className="text-3xl font-bold text-orange-900 dark:text-orange-100">{mediumPriority.length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-600 dark:text-orange-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700 dark:text-blue-300">{t('notifications.info')}</p>
                <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">{lowPriority.length}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            {t('notifications.clientAlerts')}
          </CardTitle>
          <CardDescription>
            {t('notifications.clientAlertsDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...highPriority, ...mediumPriority, ...lowPriority].map((alert, idx) => (
              <div
                key={`${alert.workspaceId}-${alert.type}-${idx}`}
                className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all hover:shadow-md ${getSeverityColor(alert.severity)}`}
              >
                <div className="flex items-start gap-3 flex-1">
                  <div className="mt-0.5">
                    {getIcon(alert.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Building2 className="h-4 w-4 flex-shrink-0" />
                      <span className="font-semibold truncate">{alert.companyName}</span>
                    </div>
                    <p className="text-sm">{alert.message}</p>
                    <Badge variant="outline" className="mt-2 text-xs">
                      {getSeverityLabel(alert.severity)}
                    </Badge>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleViewCompany(alert.workspaceId)}
                  className="ml-2 flex-shrink-0"
                >
                  {t('notifications.view')}
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
