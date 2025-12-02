import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Users, TrendingUp, Clock } from "lucide-react";
import { SaftStatusWidget } from "@/components/SaftStatusWidget";
import { InvoiceUsageWidget } from "@/components/InvoiceUsageWidget";
import { StartupDiscountBanner } from "@/components/StartupDiscountBanner";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalClients: 0,
    totalInvoices: 0,
    draftInvoices: 0,
    overdueInvoices: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Check if accountant viewing another workspace
    const activeWorkspaceOwner = sessionStorage.getItem("active_workspace_owner");
    const effectiveUserId = activeWorkspaceOwner || user.id;

    const [clientsRes, invoicesRes] = await Promise.all([
      supabase.from("clients").select("id", { count: "exact" }).eq("user_id", effectiveUserId),
      supabase.from("invoices").select("status", { count: "exact" }).eq("user_id", effectiveUserId),
    ]);

    const draftCount = invoicesRes.data?.filter(inv => inv.status === "draft").length || 0;
    const overdueCount = invoicesRes.data?.filter(inv => inv.status === "overdue").length || 0;

    setStats({
      totalClients: clientsRes.count || 0,
      totalInvoices: invoicesRes.count || 0,
      draftInvoices: draftCount,
      overdueInvoices: overdueCount,
    });
  };

  const statCards = [
    {
      title: "Total Clienți",
      value: stats.totalClients,
      icon: Users,
      color: "text-primary",
      link: "/clients",
    },
    {
      title: "Total Facturi",
      value: stats.totalInvoices,
      icon: FileText,
      color: "text-accent",
      link: "/invoices",
    },
    {
      title: "Ciorne",
      value: stats.draftInvoices,
      icon: Clock,
      color: "text-muted-foreground",
      link: "/invoices",
    },
    {
      title: "Restanțe",
      value: stats.overdueInvoices,
      icon: TrendingUp,
      color: "text-destructive",
      link: "/invoices",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
            <p className="text-muted-foreground">Bine ai venit! Iată o privire de ansamblu.</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => window.location.href = '/invoice-form'} className="gap-2">
              <FileText className="h-4 w-4" />
              Factură Nouă
            </Button>
            <Button onClick={() => window.location.href = '/clients'} variant="outline" className="gap-2">
              <Users className="h-4 w-4" />
              Client Nou
            </Button>
          </div>
        </div>

        <StartupDiscountBanner />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Link key={stat.title} to={stat.link}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </CardTitle>
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{stat.value}</div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <InvoiceUsageWidget />
            <SaftStatusWidget />
          </div>
          
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Activitate recentă</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nu există activitate recentă</p>
                  <p className="text-sm mt-2">Creează prima ta factură pentru a începe!</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;