import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Users, TrendingUp, Clock } from "lucide-react";

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

    const [clientsRes, invoicesRes] = await Promise.all([
      supabase.from("clients").select("id", { count: "exact" }).eq("user_id", user.id),
      supabase.from("invoices").select("status", { count: "exact" }).eq("user_id", user.id),
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
    },
    {
      title: "Total Facturi",
      value: stats.totalInvoices,
      icon: FileText,
      color: "text-accent",
    },
    {
      title: "Ciorne",
      value: stats.draftInvoices,
      icon: Clock,
      color: "text-muted-foreground",
    },
    {
      title: "Restanțe",
      value: stats.overdueInvoices,
      icon: TrendingUp,
      color: "text-destructive",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Bine ai venit! Iată o privire de ansamblu.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title} className="hover:shadow-lg transition-shadow">
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
            );
          })}
        </div>

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
    </DashboardLayout>
  );
};

export default Dashboard;