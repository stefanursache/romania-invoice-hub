import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface PlanLimits {
  plan: string;
  invoiceLimit: number;
  memberLimit: number;
  invoicesThisMonth: number;
  currentMembers: number;
  canCreateInvoice: boolean;
  canAddMember: boolean;
  usagePercentage: number;
}

export const usePlanLimits = () => {
  const [limits, setLimits] = useState<PlanLimits | null>(null);
  const [loading, setLoading] = useState(true);

  const getPlanLimits = (plan: string) => {
    switch (plan?.toLowerCase()) {
      case "starter":
        return { invoiceLimit: 25, memberLimit: 3 };
      case "professional":
        return { invoiceLimit: 100, memberLimit: 10 };
      case "enterprise":
        return { invoiceLimit: Infinity, memberLimit: Infinity };
      default:
        return { invoiceLimit: 5, memberLimit: 1 };
    }
  };

  const loadLimits = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user's plan
      const { data: profile } = await supabase
        .from("profiles")
        .select("payment_plan")
        .eq("id", user.id)
        .single();

      const plan = profile?.payment_plan || "free";
      const planLimits = getPlanLimits(plan);

      // Count invoices created this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count: invoiceCount } = await supabase
        .from("invoices")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", startOfMonth.toISOString());

      // Count current team members
      const { count: memberCount } = await supabase
        .from("workspace_members")
        .select("*", { count: "exact", head: true })
        .eq("workspace_owner_id", user.id);

      const invoicesThisMonth = invoiceCount || 0;
      const currentMembers = (memberCount || 0) + 1; // +1 for owner

      const usagePercentage = planLimits.invoiceLimit === Infinity 
        ? 0 
        : planLimits.invoiceLimit > 0 
          ? (invoicesThisMonth / planLimits.invoiceLimit) * 100
          : 0;

      setLimits({
        plan,
        invoiceLimit: planLimits.invoiceLimit,
        memberLimit: planLimits.memberLimit,
        invoicesThisMonth,
        currentMembers,
        canCreateInvoice: invoicesThisMonth < planLimits.invoiceLimit,
        canAddMember: currentMembers < planLimits.memberLimit,
        usagePercentage,
      });
    } catch (error) {
      console.error("Error loading plan limits:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLimits();
  }, []);

  return { limits, loading, refresh: loadLimits };
};
