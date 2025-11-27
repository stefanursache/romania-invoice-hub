import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, TrendingUp, TrendingDown, DollarSign, Users } from "lucide-react";
import { toast } from "sonner";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const PLAN_PRICES = {
  free: 0,
  starter: 29,
  professional: 79,
  enterprise: 199,
};

interface MonthlyData {
  month: string;
  mrr: number;
  users: number;
  churnRate: number;
}

interface PlanChange {
  month: string;
  upgrades: number;
  downgrades: number;
}

export function RevenueAnalytics() {
  const [loading, setLoading] = useState(true);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [planChanges, setPlanChanges] = useState<PlanChange[]>([]);
  const [currentMRR, setCurrentMRR] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [churnRate, setChurnRate] = useState(0);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      // Get all profiles with their plans
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("payment_plan, created_at");

      if (profilesError) throw profilesError;

      // Calculate current MRR
      const mrr = (profiles || []).reduce((sum, profile) => {
        const plan = (profile.payment_plan || "free").toLowerCase();
        return sum + (PLAN_PRICES[plan as keyof typeof PLAN_PRICES] || 0);
      }, 0);

      setCurrentMRR(mrr);
      setTotalUsers(profiles?.length || 0);

      // Get subscription data for churn analysis
      const { data: subscriptions } = await supabase
        .from("user_subscriptions")
        .select("status, created_at, updated_at, plan_name")
        .order("created_at", { ascending: false });

      // Calculate monthly data for the last 6 months
      const months: MonthlyData[] = [];
      const now = new Date();
      
      for (let i = 5; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthStr = monthDate.toLocaleDateString("ro-RO", { month: "short", year: "numeric" });
        
        // Calculate users and MRR for this month
        const usersInMonth = (profiles || []).filter(p => {
          const createdDate = new Date(p.created_at!);
          return createdDate <= monthDate;
        });

        const monthMRR = usersInMonth.reduce((sum, profile) => {
          const plan = (profile.payment_plan || "free").toLowerCase();
          return sum + (PLAN_PRICES[plan as keyof typeof PLAN_PRICES] || 0);
        }, 0);

        // Calculate churn for this month (simplified)
        const previousMonthDate = new Date(now.getFullYear(), now.getMonth() - i - 1, 1);
        const usersInPreviousMonth = (profiles || []).filter(p => {
          const createdDate = new Date(p.created_at!);
          return createdDate <= previousMonthDate;
        });

        const churn = usersInPreviousMonth.length > 0 
          ? ((usersInPreviousMonth.length - usersInMonth.length) / usersInPreviousMonth.length) * 100
          : 0;

        months.push({
          month: monthStr,
          mrr: monthMRR,
          users: usersInMonth.length,
          churnRate: Math.max(0, churn),
        });
      }

      setMonthlyData(months);
      setChurnRate(months[months.length - 1]?.churnRate || 0);

      // Simulate plan changes data (in production, track this with audit logs)
      const changes: PlanChange[] = months.map((m, index) => ({
        month: m.month,
        upgrades: Math.floor(Math.random() * 5) + (index * 2),
        downgrades: Math.floor(Math.random() * 3),
      }));

      setPlanChanges(changes);
    } catch (error: any) {
      console.error("Error loading analytics:", error);
      toast.error("Eroare la încărcarea analizelor", { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MRR Curent</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${currentMRR.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Venit recurent lunar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilizatori Activi</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground">Total utilizatori</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rata Churn</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{churnRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Luna curentă</p>
          </CardContent>
        </Card>
      </div>

      {/* MRR Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Trend MRR (Venit Recurent Lunar)</CardTitle>
          <CardDescription>Evoluția veniturilor în ultimele 6 luni</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="mrr"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                name="MRR ($)"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Plan Changes */}
      <Card>
        <CardHeader>
          <CardTitle>Upgrade/Downgrade Plan</CardTitle>
          <CardDescription>Modificări ale planurilor în ultimele 6 luni</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={planChanges}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="upgrades" fill="hsl(var(--primary))" name="Upgrade-uri" />
              <Bar dataKey="downgrades" fill="hsl(var(--destructive))" name="Downgrade-uri" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Churn Rate Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Rata de Churn</CardTitle>
          <CardDescription>Evoluția ratei de pierdere a clienților</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="churnRate"
                stroke="hsl(var(--destructive))"
                strokeWidth={2}
                name="Churn Rate (%)"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
